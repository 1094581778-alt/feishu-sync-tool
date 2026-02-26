#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[cfg(target_os = "windows")]
extern crate winreg;

#[cfg(target_os = "windows")]
use winreg::{enums::*, RegKey};

use std::process::Command;
use std::thread;
use std::time::Duration;

fn start_next_server() {
    let exe_dir = std::env::current_exe()
        .ok()
        .and_then(|p| p.parent().map(|p| p.to_path_buf()))
        .unwrap_or_default();
    
    let server_path = exe_dir.join("server.js");
    
    if server_path.exists() {
        let server_dir = exe_dir.clone();
        
        std::thread::spawn(move || {
            let child = Command::new("node")
                .arg(server_path)
                .current_dir(server_dir)
                .spawn();
            
            match child {
                Ok(_) => {
                    println!("Next.js server started successfully");
                }
                Err(e) => {
                    eprintln!("Failed to start Next.js server: {}", e);
                }
            }
        });
        
        thread::sleep(Duration::from_secs(3));
    } else {
        eprintln!("Next.js server.js not found at: {:?}", server_path);
    }
}

fn main() {
    #[cfg(target_os = "windows")]
    {
        start_next_server();
    }
    
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            get_app_version,
            check_previous_deployment
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[tauri::command]
async fn check_previous_deployment() -> Result<bool, String> {
    #[cfg(target_os = "windows")] {
        let uninstall_keys = vec![
            "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall",
            "SOFTWARE\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall"
        ];
        
        let app_paths_key = "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths";
        let app_name = "飞书数据同步工具";
        let exe_name = "feishu_sync_tool.exe";
        
        for key_path in &uninstall_keys {
            if let Ok(hklm) = RegKey::predef(HKEY_LOCAL_MACHINE)
                .open_subkey(key_path)
            {
                for subkey in hklm.enum_keys() {
                    if let Ok(subkey_name) = subkey {
                        if subkey_name.contains(app_name) {
                            return Ok(true);
                        }
                    }
                }
            }
            
            if let Ok(hkcu) = RegKey::predef(HKEY_CURRENT_USER)
                .open_subkey(key_path)
            {
                for subkey in hkcu.enum_keys() {
                    if let Ok(subkey_name) = subkey {
                        if subkey_name.contains(app_name) {
                            return Ok(true);
                        }
                    }
                }
            }
        }
        
        if let Ok(hklm) = RegKey::predef(HKEY_LOCAL_MACHINE)
            .open_subkey(app_paths_key)
        {
            for subkey in hklm.enum_keys() {
                if let Ok(subkey_name) = subkey {
                    if subkey_name == exe_name {
                        return Ok(true);
                    }
                }
            }
        }
        
        Ok(false)
    }
    #[cfg(not(target_os = "windows"))] {
        Ok(false)
    }
}
