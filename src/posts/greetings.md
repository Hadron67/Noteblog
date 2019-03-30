---
layout: post
title:  "Long time no see!"
date:   2019-03-19 22:03:01 +0800
categories: jekyll
---
As you may have noticed, my site haven't been updated for almost 3 years! This could results from that I have been busy with a lot things, such as exams, final thesis, plus that I'm running out of ideas. But now, I'm in a relatively free period and I want to keep my blog from being abandonded.

My future blogs will mainly be my notes that explain my understanding of things I have learned. 

<!-- more -->

I have now switched my blog engine from Hexo to Jekyll, to obtain more freedom of site design. The main reason is the simplicity of Jekyll, I mean the site structure and configuration. Although generally speaking Hexo is an easy-to-use blog framework, it has some flaws that are intolerable for me. It doesn't take care of mathematical expressions in markdown file forces me to escape any Mathjax characters like `_` and `\\` that conflict with markdown, which was a pain. Another problem is any file - including non-markdown files like html and js, will be processed by the markdown renderer, even if I have added them to the exclude list. This is actually a bug, and haven't been fixed before I pausing updating my blog.

## Mathjax test
Following is a test equation that contains special characters in **markdown**: 

$$
\sigma_x = \begin{pmatrix}
    0 & 1 \\ 1 & 0
\end{pmatrix}\qquad
\sigma_y = \begin{pmatrix}
    0 & -i \\ i & 0
\end{pmatrix}\qquad
\sigma_z = \begin{pmatrix}
    1 & 0 \\ 0 & -1
\end{pmatrix}.
$$