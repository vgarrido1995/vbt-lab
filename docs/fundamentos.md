# Fundamentos científicos de VBT Lab

Documento técnico condensado con las ecuaciones, supuestos y citas que respaldan cada uno de los cinco módulos.

---

## 1. Práctica 3 — Perfil mecánico carga-velocidad

**Modelo:** regresión lineal por mínimos cuadrados sobre N pares (Carga, VM):

$$
v = -a \cdot L + v_0
$$

**Variables derivadas:**

| Variable | Fórmula | Interpretación |
|---|---|---|
| `v₀` | intercepto | Velocidad máxima teórica (capacidad de velocidad pura) |
| `a` | pendiente (negativa) | Tasa de degradación de v por kg añadido |
| `L₀` | `v₀ / |a|` | Carga máxima teórica (capacidad de fuerza pura) |
| `A_line` | `L₀ · v₀ / 2` | Área bajo la línea — índice global de rendimiento mecánico |
| `R²` | bondad de ajuste | Aceptable si ≥ 0,95 |

**Cita:** González-Badillo et al. (2017). *La velocidad de ejecución como referencia para la programación, control y evaluación del entrenamiento de fuerza*.

---

## 2. Práctica 4 — Estimador de 1RM (método de dos puntos)

**Modelo:** `L = a · v + b`, ajustado con sólo 2 puntos (carga ligera ≈ 40 % 1RM y carga pesada ≈ 85 % 1RM).
**Predicción:** `1RM = a · v_ML + b` donde `v_ML` es la velocidad mínima asociada al 1RM del ejercicio (tabla en `js/data/ejercicios.js`).

**Reglas de fiabilidad:**

- **D1** = `v_pesada − v_ML` ≤ 0,35 m/s.
- **D2** = `v_ligera − v_pesada` ∈ [0,40, 0,60] m/s.
- `v_ligera` > `v_pesada` (obligatorio).
- `v_pesada` > `v_ML` (obligatorio).

**Cita:** García-Ramos & Jaric (2018), *Strength and Conditioning Journal* 40(2), 54-66; Pérez-Castilla et al. (2021).

---

## 3. Práctica 5 — Grado de esfuerzo (%Rep ↔ %PV)

Para una serie llevada al fallo con N repeticiones:

$$
\%Rep_i = \frac{i}{N}\cdot 100, \qquad \%PV_i = \left(1 - \frac{v_i}{v_{max}}\right)\cdot 100
$$

**Modelo:** regresión polinómica de grado 2

$$
\%Rep = \alpha\cdot(\%PV)^2 + \beta\cdot(\%PV) + \gamma
$$

> **Nota técnica.** El manual original representa %PV en eje Y y %Rep en eje X. Aquí invertimos el ajuste porque la utilidad práctica es predecir el grado de esfuerzo (%Rep) a partir del %PV observado en tiempo real durante la serie.

**Cita:** Sánchez-Medina & González-Badillo (2011), *Medicine & Science in Sports & Exercise* 43(9), 1725-1734.

---

## 4. Práctica 6 — Predicción del MNR

**Modelo:** `MNR = m · v_1ªrep + n` ajustado con 2-3 series llevadas al fallo a distintas %1RM (típicamente 65, 75 y 85 %).
La velocidad de la **repetición más rápida** (suele ser la primera) predice el número máximo de repeticiones que se podrían completar al fallo.

**Validaciones:**
- Predicción < 0 → se muestra 0 con aviso “probablemente ya estás en fallo”.
- Velocidad fuera del rango calibrado → aviso de extrapolación.

**Cita:** González-Badillo et al. (2017); Sánchez-Medina & González-Badillo (2011).

---

## 5. Práctica 7 — Calculadora de RIR

**Modelo:** `RIR = m · v + n` (regresión lineal sobre todos los datos del atleta — “modelo múltiple” recomendado por simplicidad práctica).

**Semáforo:**
- 🟢 RIR ≥ 3 — lejos del fallo.
- 🟡 RIR 1–2 — proximidad alta.
- 🔴 RIR ≤ 0 — fallo o por encima.

**Validaciones:**
- Truncado al rango [0, 8].
- R² < 0,60 → aviso de bondad de ajuste baja.

**Cita:** Weakley et al. (2021), *Strength and Conditioning Journal* 43(2), 31-49; Jukic et al. (2023).

---

## Catálogo VML (`js/data/ejercicios.js`)

| Ejercicio | VML (m/s) | Referencia |
|---|---:|---|
| Press de banca (Smith) | 0,17 | Pérez-Castilla et al., 2021 |
| Press de banca (libre) | 0,17 | García-Ramos & Jaric, 2018 |
| Sentadilla completa | 0,30 | Pérez-Castilla et al., 2022 |
| Sentadilla paralela | 0,32 | Sánchez-Medina et al., 2017 |
| Press militar | 0,18 | Balsalobre-Fernández et al., 2018 |
| Remo tumbado prono | 0,50 | Miras-Moreno et al., 2022 |
| Remo invertido | 0,50 | Pérez-Castilla et al., 2023b |
| Peso muerto convencional | 0,14 | Lake et al., 2017 |
| Dominada con lastre | 0,23 | Sánchez-Moreno et al., 2017 |
| Hip thrust | 0,30 | García-Ramos et al., 2020 |

La UI permite **sobrescribir** el VML manualmente cuando el transductor o protocolo del usuario difieren. Se marca con un badge `personalizado`.
