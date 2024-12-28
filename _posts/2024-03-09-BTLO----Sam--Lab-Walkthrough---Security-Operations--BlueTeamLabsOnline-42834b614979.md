---
title: "BTLO----Sam--Lab-Walkthrough---Security-Operations--BlueTeamLabsOnline-42834b614979"
date: 2024-03-09
layout: post
categories: medium
---


BTLO — ‘Sam’ Lab Walkthrough — Security Operations, BlueTeamLabsOnline
======================================================================


The Blue Team Labs Online lab called ‘Sam’ is a medium difficult box focused on Security Operations. This investigation is conducted on…

---

### BTLO — ‘Sam’ Lab Walkthrough — Security Operations, BlueTeamLabsOnline

The Blue Team Labs Online lab called ‘Sam’ is a medium difficult box focused on Security Operations. This investigation is conducted on Linux and we’ll be diving into Windows event traffic to make sense of what happened on the victim machine. We’re given Sysmon logs (json), network traffic (pcap) and a memory dump (.raw) file to work with. We utilize tools such as Volatility2, Wireshark and the Linux CLI to parse these log files.

The ‘Sam’ lab also showcases the MITRE ATT&CK Technique **T1078.003**; Valid Accounts, Local Accounts. This is an initial access vector that was on the rise in 2023, according to **IBM’s X-Force Threat Intel Index 2024**. Interestingly, this uptick was accompanied by a decrease in phishing as an initial access vector. The use of Valid Accounts, Local Accounts by an attacker is revealed in the investigation of this lab.

This lab is an excellent showcase of what a SOC Analyst might experience on the job while triaging logs files and gathering relevant information such as Indicators of Compromise, Attacker IP’s & ports, obfuscation techniques, privilege escalation, enumeration and network logs.

There’s always more than one way to solve a box and this is how I did it! If you’ve already completed this lab, what steps did you take and how did they differ from my approach? I’m always keen to learn new methods and figure out how other investigators think about the problems they have to solve.

**IBM X-Force Threat Intelligence Index 2024:** <https://jh.live/x-force-report>

**BTLO Lab — ‘Sam’:** <https://blueteamlabs.online/home/investigation/sam-d310695187>

**BlueTeamLabsOnline:** <https://blueteamlabs.online/>



By [Grant Wilsey](https://medium.com/@darkyolks) on [March 9, 2024](https://medium.com/p/42834b614979).

[Canonical link](https://medium.com/@darkyolks/btlo-sam-lab-walkthrough-security-operations-blueteamlabsonline-42834b614979)

Exported from [Medium](https://medium.com) on December 27, 2024.

