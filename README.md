# 🏋️ VBT Lab — Velocity-Based Training Lab

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Made with vanilla JS](https://img.shields.io/badge/made%20with-vanilla%20JS-f7df1e.svg)](https://developer.mozilla.org/docs/Web/JavaScript)
[![Deploy: GitHub Pages](https://img.shields.io/badge/deploy-GitHub%20Pages-2ea44f.svg)](https://pages.github.com/)
[![No build step](https://img.shields.io/badge/build-zero%20config-blue.svg)](#cómo-desplegar-en-github-pages)

> **Laboratorio digital para evaluación neuromuscular mediante velocidad de ejecución.**
> SPA 100 % client-side que implementa las **Prácticas 3 a 7** del manual *“Últimas tendencias prácticas para la evaluación y prescripción del entrenamiento de fuerza”* (Universidad de Almería · edUAL Textos Docentes 158).

---

## 📐 Fundamento científico

El paradigma **VBT (Velocity-Based Training)** sustituye el control de la carga por porcentajes de 1RM por la **monitorización de la velocidad media (VM)** de cada repetición, registrada con un encoder o transductor lineal (T-Force, Vitruve, GymAware, Speed4Lifts, Chronojump…). Cada módulo de la app aplica una práctica del manual:

- **Práctica 3 — Perfil mecánico carga-velocidad.** Regresión lineal `v = -a·L + v₀` que cuantifica la capacidad de fuerza pura (`L₀`), la capacidad de velocidad pura (`v₀`) y un índice global del rendimiento mecánico (`A_line = L₀·v₀/2`). Permite comparar perfiles intra-sujeto a lo largo del tiempo (González-Badillo et al., 2017).
- **Práctica 4 — Estimación del 1RM por método de dos puntos.** Con dos cargas distantes (≈ 40 % y ≈ 85 % 1RM) se proyecta la recta `L = a·v + b` hasta la **velocidad mínima asociada al 1RM (VML)** del ejercicio (García-Ramos & Jaric, 2018; Pérez-Castilla et al., 2021).
- **Práctica 5 — Grado de esfuerzo (%Rep ↔ %PV).** Curva polinómica de grado 2 que relaciona la **pérdida de velocidad intra-serie** con el **% de repeticiones realizadas** respecto al máximo. Cuantifica objetivamente la proximidad al fallo (Sánchez-Medina & González-Badillo, 2011).
- **Práctica 6 — Predicción del MNR (Máximo Nº de Repeticiones).** Recta `MNR = m·v + n` ajustada a partir de la **velocidad de la repetición más rápida** de la serie. Modelo individualizable y reutilizable en sesiones futuras (González-Badillo et al., 2017).
- **Práctica 7 — Calculadora de RIR.** Recta `RIR = m·v + n` que estima en tiempo real cuántas reps quedan en reserva, con semáforo 🟢🟡🔴 (Weakley et al., 2021; Jukic et al., 2023).

---

## 🚀 Cómo usar

1. Abre `index.html` en cualquier navegador moderno (Chrome, Edge, Firefox, Safari).
2. Navega entre los módulos con las pestañas superiores o cambiando el hash de la URL (`#perfil`, `#rm`, `#esfuerzo`, `#mnr`, `#rir`).
3. Cada módulo tiene un botón **“Cargar ejemplo del manual”** que precarga los datos exactos de la sección práctica del capítulo correspondiente para verificar resultados.
4. Tus datos y la preferencia de tema (claro/oscuro) se guardan automáticamente en `localStorage` bajo el espacio de nombres `vbt:*`.

### Por módulo

| Módulo | Inputs mínimos | Outputs |
|---|---|---|
| **Perfil C-V** | ≥ 2 pares (kg, m/s) | v₀, L₀, A_line, R², gráfica |
| **Estimador 1RM** | Ejercicio + 2 cargas (kg, m/s) | 1RM (kg), %1RM pesada, recta L-v |
| **Grado de esfuerzo** | ≥ 4 reps al fallo (m/s) | Curva %Rep-%PV + predictor en tiempo real |
| **Predicción MNR** | 2-3 series (%1RM, MNR, v_max) | Ecuación individual + predictor |
| **Calculadora RIR** | ≥ 4 mediciones (RIR, v) | Recta RIR-v + semáforo |

### Acciones globales

- `📋 Copiar resumen` — exporta los resultados del módulo activo en Markdown.
- `💾 Descargar PNG` — guarda el gráfico como imagen.
- `Ctrl+P` / `⌘+P` — imprime los resultados (los menús se ocultan automáticamente).
- Toggle ☀️/🌙 — alterna tema claro/oscuro y se aplica a los gráficos.

---

## ☁️ Cómo desplegar en GitHub Pages

```bash
# 1. Crea el repo y sube los archivos
git init
git add .
git commit -m "feat: VBT Lab v1"
git branch -M main
git remote add origin https://github.com/<tu-usuario>/vbt-lab.git
git push -u origin main

# 2. En GitHub: Settings → Pages → Source: "Deploy from a branch"
#    Branch: main · Folder: / (root)
# 3. Tu sitio estará disponible en:
#    https://<tu-usuario>.github.io/vbt-lab/
```

El archivo [`.nojekyll`](.nojekyll) evita que GitHub Pages procese los archivos con Jekyll. No hay build step: lo que ves en el repo es lo que se sirve.

---

## 🗂️ Estructura del proyecto

```
vbt-lab/
├── index.html
├── README.md
├── LICENSE
├── .nojekyll
├── assets/
│   └── favicon.svg
├── css/
│   └── styles.css
├── js/
│   ├── app.js
│   ├── store.js
│   ├── ui.js
│   ├── stats.js
│   ├── charts.js
│   ├── modules/
│   │   ├── perfilMecanico.js   ← Práctica 3
│   │   ├── estimadorRM.js      ← Práctica 4
│   │   ├── gradoEsfuerzo.js    ← Práctica 5
│   │   ├── prediccionMNR.js    ← Práctica 6
│   │   └── calculadoraRIR.js   ← Práctica 7
│   └── data/
│       └── ejercicios.js
└── docs/
    └── fundamentos.md
```

---

## 📚 Referencias bibliográficas

- Balsalobre-Fernández, C., García-Ramos, A., & Jiménez-Reyes, P. (2018). Load–velocity profiling in the military press exercise: Effects of gender and training. *International Journal of Sports Science & Coaching*, 13(5), 743-750.
- García-Ramos, A., & Jaric, S. (2018). Two-point method: A quick and fatigue-free procedure for assessment of muscle mechanical capacities. *Strength and Conditioning Journal*, 40(2), 54-66.
- González-Badillo, J. J., Sánchez-Medina, L., Pareja-Blanco, F., & Rodríguez-Rosell, D. (2017). *La velocidad de ejecución como referencia para la programación, control y evaluación del entrenamiento de fuerza*. Ergotech.
- Jukic, I., García-Ramos, A., Malecek, J., Omcirk, D., & Tufano, J. J. (2023). The use of lifting straps alters the entire load-velocity profile during the deadlift exercise. *Journal of Strength and Conditioning Research*, 37(2), 343-348.
- Pérez-Castilla, A., Piepoli, A., Delgado-García, G., Garrido-Blanca, G., & García-Ramos, A. (2021). Reliability and concurrent validity of seven commercially available devices for the assessment of movement velocity at different intensities during the bench press. *Journal of Strength and Conditioning Research*, 35(5), 1303-1310.
- Pérez-Castilla, A., Miras-Moreno, S., Weakley, J., & García-Ramos, A. (2022). Relationship between the load-velocity relationships of full and half back-squat exercises. *Journal of Strength and Conditioning Research*, 36(11), 2999-3006.
- Pérez-Castilla, A., et al. (2023b). Reliability and validity of the load-velocity relationship to predict the 1RM in the inverted row exercise. *Sports Biomechanics*. (online ahead of print).
- Sánchez-Medina, L., & González-Badillo, J. J. (2011). Velocity loss as an indicator of neuromuscular fatigue during resistance training. *Medicine & Science in Sports & Exercise*, 43(9), 1725-1734.
- Sánchez-Medina, L., Pallarés, J. G., Pérez, C. E., Morán-Navarro, R., & González-Badillo, J. J. (2017). Estimation of relative load from bar velocity in the full back squat exercise. *Sports Medicine International Open*, 1(2), E80-E88.
- Weakley, J., Mann, B., Banyard, H., McLaren, S., Scott, T., & García-Ramos, A. (2021). Velocity-based training: From theory to application. *Strength and Conditioning Journal*, 43(2), 31-49.

📖 **Manual base:** Universidad de Almería, *edUAL — Textos Docentes 158*: Manual sobre las últimas tendencias prácticas para la evaluación y prescripción del entrenamiento de fuerza.

---

## ⚠️ Disclaimer

Esta herramienta es **educativa** y **no sustituye el criterio de un profesional cualificado**. Las estimaciones dependen críticamente de:

- la calidad y calibración del transductor de velocidad,
- el cumplimiento estricto del protocolo de evaluación (técnica, calentamiento, descansos),
- la individualización de los valores VML (que la app permite editar manualmente).

Úsala como complemento al juicio clínico/deportivo, nunca como sustituto.
