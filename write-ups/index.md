---
layout: default
title: Write Ups
---
<h1>Write Ups</h1>
<ul>
{% for post in site.categories.write-ups %}
  <li>
    <a href="{{ post.url }}">{{ post.title }}</a>
  </li>
{% endfor %}
</ul>
