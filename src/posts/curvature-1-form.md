---
layout: post
title: Curvature 1-forms and tetrad method
date: 2019-3-31 16:28:12 +0800
category: Note
tags:
- General relativity
- Differential geometry
---
In differential geometry, and especially in general relativity, the Riemann curvature tensor is an important object for the geometric property of a manifold, solving the Enstein's equation one always needs to calculate the curvature tensor. But the component expression of Riemann tensor is too complicated, making it painful to calculate it by hand, and less powerful when dealing with various problems. This is where curvature 1-form comes out.

<!-- more -->

## Definitions
Among textbooks and lectures, there're two different yet equivalent definitions of Riemann curvature tensor:
$$
\begin{align}
2\nabla_{[a}\nabla_{b]}\omega_c & = R_{abc}{}^d \omega_d; \\
2\nabla_{[a}\nabla_{b]}v^c & = R^c{}_{dab} v^d.
\end{align}
$$
From which we can write their component expressions:
$$
\begin{align}
    R_{\mu\nu\lambda}{}^\rho & = -2\partial_{[\mu}\Gamma^\rho_{\nu]\lambda} + 2\Gamma^\sigma_{[\mu|\lambda}\Gamma^\rho_{\nu]\sigma};\\
    R^\rho{}_{\lambda\mu\nu} & = 2\partial_{[\mu}\Gamma^\rho_{\nu]\lambda} + \Gamma^\rho_{[\mu|\sigma}\Gamma^\sigma_{\nu]\lambda}.
\end{align}
$$
Since the second is more common, we will use it in the rest of this article.

### Connection 1-form
Instead of work in the coordinate tetrad, as one usually did in general relativity, we choose an othonormal tetrad $\{e^\mu\}$, in which case the connection is $\gamma^\mu_{\alpha\beta}$. 