---
layout: default
title: About
---
<h1>About Me</h1>
<ul>
{% for post in site.categories.about %}
  <li>
    <a href="{{ post.url }}">{{ post.title }}</a>
  </li>
{% endfor %}
</ul>
