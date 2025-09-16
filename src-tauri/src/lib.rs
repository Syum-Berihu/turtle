use nix::poll::{poll, PollFd, PollFlags};
use nix::pty::forkpty;
use nix::unistd::{execvp, read, write, ForkResult};
use once_cell::sync::OnceCell;
use std::ffi::{CStr, CString};
use std::os::fd::{AsRawFd, FromRawFd, OwnedFd};
use std::sync::Mutex;
use std::time::{Instant, SystemTime, UNIX_EPOCH};
use tauri::{Builder, Emitter};

const EXEC_BYTES: &'static [u8] = include_bytes!("../bin/agent");

static PTY_MASTER: OnceCell<Mutex<OwnedFd>> = OnceCell::new();

fn read_from_fd(fd: &impl AsRawFd) -> Option<Vec<u8>> {
    let mut read_buffer = [0; 65536];
    let raw_fd = fd.as_raw_fd();
    match read(raw_fd, &mut read_buffer) {
        Ok(bytes_read) if bytes_read > 0 => Some(read_buffer[..bytes_read].to_vec()),
        _ => None,
    }
}

fn spawn_pty_with_shell(command: &str) -> OwnedFd {
    match forkpty(None, None) {
        Ok(fork_pty_res) => {
            let stdout_fd = fork_pty_res.master;
            if let ForkResult::Child = fork_pty_res.fork_result {
                let args = vec!["sh", "-i", "-c", command];
                let c_args: Vec<CString> =
                    args.iter().map(|arg| CString::new(*arg).unwrap()).collect();
                let c_args_ref: Vec<&CStr> = c_args.iter().map(|arg| arg.as_c_str()).collect();

                std::env::remove_var("PROMPT_COMMAND");
                std::env::set_var("PS1", "");
                match execvp(c_args_ref[0], &c_args_ref) {
                    Ok(_) => unreachable!(),
                    Err(e) => {
                        eprintln!("Failed to execute command: {:?}", e);
                        std::process::exit(1);
                    }
                }
            }
            unsafe { OwnedFd::from_raw_fd(stdout_fd) }
        }
        Err(e) => {
            panic!("Failed to fork PTY: {:?}", e);
        }
    }
}

//#[tauri::command]
//fn init() -> Result<(), String> {
//println!("We are initing it here!");
//let shell_fd = spawn_pty_with_shell("sh"); // or "sh"
////
//set_nonblock(&shell_fd);

//PTY_MASTER
//.set(Mutex::new(shell_fd))
//.map_err(|_| "PTY already initialized".to_string())?;
//Ok(())
//}

#[tauri::command]
fn init(app: tauri::AppHandle) -> Result<(), String> {
    println!("We are initing it here!");
    let shell_fd = spawn_pty_with_shell("sh");

    set_nonblock(&shell_fd);

    PTY_MASTER
        .set(Mutex::new(shell_fd))
        .map_err(|_| "PTY already initialized".to_string())?;

    let fd_clone = PTY_MASTER.get().unwrap();
    let app_handle = app.clone();

    std::thread::spawn(move || {
        let mut last_emit = Instant::now();

        loop {
            let fd = fd_clone.lock().unwrap();
            let raw_fd = fd.as_raw_fd();
            drop(fd); // release lock early

            let mut poll_fds = [PollFd::new(raw_fd, PollFlags::POLLIN)];
            match poll(&mut poll_fds, 200) {
                Ok(0) => continue, // timeout
                Ok(_) => {
                    let fd = fd_clone.lock().unwrap();
                    if let Some(chunk) = read_from_fd(&*fd) {
                        if let Ok(text) = String::from_utf8(chunk.clone()) {
                            app_handle.emit("shell-output", text).unwrap_or_else(|e| {
                                eprintln!("Failed to emit shell-output: {:?}", e);
                            });
                        }
                    } else {
                        eprintln!("Shell closed or error reading.");
                        break;
                    }
                }
                Err(e) => {
                    eprintln!("poll error: {:?}", e);
                    break;
                }
            }
        }
    });

    Ok(())
}

fn set_nonblock(fd: &OwnedFd) {
    let flags = nix::fcntl::fcntl(fd.as_raw_fd(), nix::fcntl::FcntlArg::F_GETFL).unwrap();
    let mut flags =
        nix::fcntl::OFlag::from_bits(flags & nix::fcntl::OFlag::O_ACCMODE.bits()).unwrap();
    flags.set(nix::fcntl::OFlag::O_NONBLOCK, true);

    nix::fcntl::fcntl(fd.as_raw_fd(), nix::fcntl::FcntlArg::F_SETFL(flags)).unwrap();
}

#[tauri::command]
fn read_shell() -> Result<String, String> {
    //let fd_lock = PTY_MASTER.get().ok_or("PTY not initialized")?;
    //let fd = fd_lock.lock().unwrap();

    //let mut output = vec![];
    //loop {
    //match read_from_fd(&*fd) {
    //Some(mut chunk) if !chunk.is_empty() => output.append(&mut chunk),
    //_ => break,
    //}
    //}

    //String::from_utf8(output).map_err(|_| "Failed to decode output".to_string())
    Ok("Hello".to_string())
}

#[tauri::command]
fn write_shell(input: &str) -> Result<(), String> {
    let fd_lock = PTY_MASTER.get().ok_or("PTY not initialized")?;
    let fd = fd_lock.lock().unwrap();
    let raw_fd = fd.as_raw_fd();

    // let mut input = input.to_string();
    // if input.ends_with('\n') {
    //     input.push('\n'); // ensure command is executed
    // }

    println!("executing {}", input);
    write(raw_fd, input.as_bytes()).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn execute_agent(instruction: &str) -> Result<String, String> {
    let fd_lock = PTY_MASTER.get().ok_or("PTY not initialized")?;
    let fd = fd_lock.lock().unwrap();
    let raw_fd = fd.as_raw_fd();

    // Write agent to temp
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_millis();
    let exec_path = std::env::temp_dir().join(format!("agent-{}", timestamp));
    std::fs::write(&exec_path, EXEC_BYTES)
        .map_err(|e| format!("Failed to write agent binary: {}", e))?;

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let mut perms = std::fs::metadata(&exec_path).unwrap().permissions();
        perms.set_mode(0o755);
        std::fs::set_permissions(&exec_path, perms).unwrap();
    }

    // Set up the command with env and instruction
    let command = format!("{} \"{}\"\n", exec_path.display(), instruction);
    //let command = format!(
        //"OPENAI_API_KEY={} {} \"{}\"\n",
        //api_key, agent_path, instruction
    //);

    //let agent_path = std::env::current_exe()
    //.unwrap()
    //.parent()
    //.unwrap()
    //.join("bin/agent");


    println!("Executing command in shell: {}", command);

    // Write to PTY
    write(raw_fd, command.as_bytes()).map_err(|e| {
        eprintln!("Failed to write to agent: {:?}", e);
        e.to_string()
    })?;

    Ok(String::new())
}

#[tauri::command]
fn send_ctrl_c() -> Result<(), String> {
    let fd_lock = PTY_MASTER.get().ok_or("PTY not initialized")?;
    let fd = fd_lock.lock().unwrap();
    let raw_fd = fd.as_raw_fd();


    write(raw_fd, &[0x03]).map_err(|e| format!("Failed to write to PTY: {}", e))?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            init,
            read_shell,
            write_shell,
            execute_agent,
            send_ctrl_c,
        ])
        .run(tauri::generate_context!())
        .expect("Error while running Tauri application");
}
