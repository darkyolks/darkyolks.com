---
title: "Studies---Course-Capstone--Dev-48600d469ad9"
date: draft_PNPT
layout: post
categories: medium
---


PNPT Studies — Course Capstone: Dev
===================================


Here is my experience rooting the Dev course capstone provdied in the PNPT certification training Practical Ethical Hacking course.

---

### PNPT Studies — Course Capstone: Dev

Here is my experience rooting the Dev course capstone provdied in the PNPT certification training Practical Ethical Hacking course.

### Introduction

This guide will provide a walkthrough of the Dev host, with the goal of demonstrating how to discover and exploit vulnerabilities in a target system. This guide assumes that you have already identified the target system and have gained access to it.

### Here’s a step-by-step guide to the technical walkthrough provided in the blog post. This guide assumes that you’re using Kali Linux as your operating system:

### Prerequisites

* Kali Linux
* ffuf
* John the Ripper or fcrackzip
* A web server running on a target machine

### Step 1 — Port Scanning

* Identify the target machine IP address and run a port scan using Nmap.
* Identify open ports, and focus on port 80 and port 8080 in this walkthrough.

### Step 2 — Directory Enumeration

* Use ffuf to discover directories on port 80 and port 8080:

```
arduinoCopy code
```
```
ffuf -w /usr/share/dibuster/directory-list-2.3-medium.txt:FUZZ -u http://[10.0.2.10]/FUZZ  
ffuf -w /usr/share/dibuster/directory-list-2.3-medium.txt:FUZZ -u http://[10.0.2.10]:8080/FUZZ
```
```
  

```
```
  

```

* Note that multi-tasking is crucial when scanning many different IP addresses.

### Step 3 — Mount the Share

* Create a directory for the share, mount it, and navigate to it:

```
bashCopy code
```
```
mkdir /tmp/nfs  
mount -t nfs 10.0.2.10:/srv/nfs /tmp/nfs -nolock  
cd nfs
```
```
  

```
```
  

```
### Step 4 — Crack the Password

* Use John the Ripper or fcrackzip to crack the password:

```
bashCopy code
```
```
fcrackzip -v -u -D -p /usr/share/wordlists/rockyou.txt save.zip
```
```
  

```
```
  

```
### Step 5 — Investigate the Directories

* Investigate the found directories, including /public, /src, /app, and /app/config:
* /public — unknown contents
* /src — unknown contents
* /app — contains a directory that may have useful information
* /app/config — contains a config.yml file with username and password information stored in it

### Step 6 — Investigate the Web Page

* Investigate the web page at <http://10.0.2.10:8080/dev>:
* Log in using the credentials found in Step 5.
* Observe that there is a search feature, but nothing immediately stands out.

### Step 7 — Exploit the Vulnerability

* Searching for a vulernability associated with BoltWire, an LFI exploit was found from GTFOBins.
* Use the following URL to access the login page: <http://10.0.2.10:8080/dev/index.php?p=welcome>
* Following the directions provided in the exploit to escalate privileges, inputting the traversal URL following /dev/index.php:

**?p=action.search&action=../../../../../../../etc/passwd**

### Conclusion

This guide demonstrated how to enumerate directories, crack a password-protected zip file, and exploit an LFI vulnerability in order to gain access to sensitive information on a target system. It is important to note that this guide is for educational purposes only and should not be



[View original.](https://medium.com/p/48600d469ad9)

Exported from [Medium](https://medium.com) on December 27, 2024.

