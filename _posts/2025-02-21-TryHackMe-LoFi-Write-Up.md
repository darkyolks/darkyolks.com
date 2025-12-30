---
layout: post
title: "TryHackMe 'LoFi' Walkthrough - Easy"
date: 2025-02-21
description: "A walkthrough of the TryHackMe lab 'LoFi'. This lab is a penetration test that includes Local File Inclusion and Path Traversal."
category: write-ups
image: '/assets/images/Labs/lofi-girl-cyber.png'
tags: [labs, educational, penetration-testing]
---

# TryHackMe: LoFi Penetration Testing Lab Walkthrough

Hey there, welcome to my walkthrough of the LoFi room on TryHackMe---an easy-rated lab that's perfect for beginners looking to dip their toes into penetration testing. In this lab, we're given context for the vulnerability we're attacking, an IP address and a simple mission: capture the flag. This room is all about Local File Inclusion (LFI) and path traversal vulnerabilities, common weaknesses in web apps that we'll be exploiting to win. Let's get started!

Room Link:  [TryHackMe - LoFi](https://tryhackme.com/room/lofi)

Relevant Learning Resources by TryHackMe:

-   [LFI Path Traversal](https://tryhackme.com/r/room/filepathtraversal)

-   [File Inclusion](https://tryhackme.com/room/fileinc)

* * * * *
### Step 1: Initial Reconnaissance
First things first, we visit the target site at http://[target-ip]/. It's a chill, music-themed page with links like "Relax," "Chill," and "Vibes" under a "Discography" section. Clicking around, I noticed the URL changes with each link: `http://[target-ip]/?page=relax.php`
![](/assets/images/Labs/LoFi-0.5.png)

This tells us the site uses a page parameter to load different PHP files. That's a big hint! When a website pulls files based on URL input like this, it's often ripe for an LFI attack---where we might trick it into showing us files it's not supposed to.

* * * * *
### Step 2: Testing for LFI Vulnerability
To see if LFI is possible, I started with a simple test: requesting a file that probably doesn't exist, like admin.php: `http://[target-ip]/?page=admin.php`
![](/assets/images/Labs/LoFi-0.6.png)

The site spat back a "Page not found" message---nothing exciting, but it shows us what a failed request looks like. Next, I went for something juicier: the /etc/passwd file, a classic target on Linux systems that lists user account info: `http://[target-ip]/?page=/etc/passwd`
![](/assets/images/Labs/LoFi-0.7.png)

Instead of the file, I got a sassy "Hacker Detected" message. Okay, fair enough---it's not going to be that easy. Looks like the site has some basic filtering, but let's not give up yet. LFI often pairs with path traversal, where we use ../ to climb up the directory tree and bypass restrictions.

* * * * *
### Step 3: Exploiting Path Traversal
Time to get crafty! I tweaked the URL with some ../ magic to navigate up the file system: `http://[target-ip]/?page=../../../etc/passwd`
![](/assets/images/Labs/LoFi-1.png)

Boom! The screen filled with the contents of /etc/passwd. By adding those ../../../, I climbed high enough to reach the root directory and pull that sensitive file. This confirms an LFI vulnerability---a huge deal in a real pentest, as it exposes system info an attacker could abuse. But we're here for the flag, so let's keep digging.

* * * * *
### Step 4: Hunting the Flag
Since this is an "Easy" lab, I figured the flag might be in a file like flag.txt. Using the same path traversal trick, I tried: `http://[target-ip]/?page=../../flag.txt`
![](/assets/images/Labs/LoFi-1.5.png)

No dice---just a "Page not found" error. No biggie, though---path traversal is a bit of a guessing game. I added one more ../ to go deeper: `http://[target-ip]/?page=../../../flag.txt`
![](/assets/images/Labs/LoFi-2.png)

Jackpot! The flag popped up on the screen. Here it is:

Final Flag:  `flag{not-the-actual-flag}`

Persistence pays off! Adjusting the number of ../ was all it took to find the right spot.

* * * * *
### Bonus: Fuzzing with Burp Suite
Manual testing worked like a charm here, but what if the file was trickier to find? Enter Burp Suite, a pentester's best friend for automating tasks like this. Here's how you can use its Intruder tool to fuzz the page parameter and uncover files:
1.  Set Up Your Proxy:
    -   Enable FoxyProxy in Firefox, set to route traffic through Burp Suite on port 8080.
    -   In Burp, head to the Proxy tab and turn on the Interceptor to snag requests.

2.  Capture a Request:
    -   Click a link on the site (like "Relax") to capture a GET request in Burp's Proxy tab.

3.  Send to Intruder:
    -   Highlight the request, hit Ctrl + I (or right-click > Send to Intruder).

4.  Configure the Attack:

    -   In the Intruder tab, select the Sniper attack type.

    -   Highlight relax.php in `?page=relax.php` and click Add to mark it as the fuzzing target.
    ![](/assets/images/Labs/LoFi-Burp-1.png)

5.  Load a Wordlist:
    -   Go to the Payloads tab, click Load, and pick a wordlist. I used `dirTraversal-nix.txt` (found at `/usr/share/wordlists/wfuzz/vulns/dirTraversal-nix.txt`), packed with common path traversal payloads like `../../../etc/passwd`.

6.  Launch the Attack:
    -   Hit Start Attack. A new window shows each request's results as they roll in.

7.  Analyze the Output:
    -   Most responses were around 4000 bytes long (the "not found" page), but a few stood out at 4852 bytes. Checking the Response tab for those, I saw the /etc/passwd contents---score!
    ![](/assets/images/Labs/LoFi-Burp-2.5.png)

This method's overkill for LoFi, but it's a killer skill for tougher labs or real-world tests where manual guessing won't cut it.

* * * * *
### Key Takeaways
-   LFI Basics: If a site uses URL parameters to load files, test for LFI by feeding it unexpected inputs.
-   Path Traversal: Use ../ to move up directories and access restricted files.
-   Manual vs. Automated: Start with hands-on testing to learn the ropes, then scale up with tools like Burp Suite.
-   Stay Curious: If one path fails, tweak it and try again---hacking's all about experimenting!

* * * * *
#### Tools Used
-   Manual Testing: Just a browser and some clever URL tweaks.
-   Burp Suite: For fuzzing with the Intruder tool.
-   Wordlist:  dirTraversal-nix.txt for path traversal payloads.

Other awesome tools for this kind of work:
-   ffuf: Fast and flexible command-line fuzzer.
-   dirb: Simple directory brute-forcer.
-   dirbuster: Dirb with a GUI, if you're into that.

* * * * *
## Wrap-Up
The LoFi room is a blast for learning LFI and path traversal hands-on. We poked around, exploited a vulnerability, and snagged the flag---all in a beginner-friendly package. In the real world, findings like this could lead to serious trouble, so always handle them responsibly.

Thanks for following along! Add your screenshots, and you've got a killer blog post. Keep hacking, and see you on the next TryHackMe adventure!