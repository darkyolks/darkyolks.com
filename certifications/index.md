---
layout: default
title: Certifications
---
<h1>Certifications</h1>
<ul>
{% for post in site.categories.certifications %}
  <li>
    <a href="{{ post.url }}">{{ post.title }}</a>
  </li>
{% endfor %}
</ul>
