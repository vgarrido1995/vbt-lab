/*
 * js/modules/referencias.js
 * Sección estática con las referencias bibliográficas y enlaces de soporte.
 * Replica el patrón "📚 Estudios" de proyectos similares (samozino-fvp).
 */
import { h, clear, moduleHeader, card } from '../ui.js';

const REFS = [
  {
    cat: 'Manual base',
    items: [
      {
        cite: 'González-Badillo, J. J., Sánchez-Medina, L., Pareja-Blanco, F., & Rodríguez-Rosell, D. (2017). La velocidad de ejecución como referencia para la programación, control y evaluación del entrenamiento de fuerza. Ergotech.',
        nota: 'Obra de referencia para todas las prácticas (3-7) implementadas en VBT Lab.'
      },
      {
        cite: 'Universidad de Almería (edUAL — Textos Docentes 158). Manual sobre las últimas tendencias prácticas para la evaluación y prescripción del entrenamiento de fuerza.',
        nota: 'Manual oficial del cual se extraen los protocolos y los datos de ejemplo de cada módulo.'
      }
    ]
  },
  {
    cat: 'Práctica 3 — Perfil mecánico carga-velocidad',
    items: [
      { cite: 'Jiménez-Reyes, P., Castaño-Zambudio, A., Cuadrado-Peñafiel, V., González-Hernández, J. M., Capelo-Ramírez, F., Martínez-Aranda, L. M., & González-Badillo, J. J. (2019). Differences between adjusted vs. non-adjusted loads in velocity-based training. International Journal of Sports Medicine, 40(15), 939-946.' },
      { cite: 'Loturco, I., Pereira, L. A., Cal Abad, C. C., Gil, S., Kitamura, K., Kobal, R., & Nakamura, F. Y. (2017). Using bar velocity to predict the maximum dynamic strength in the half-squat exercise. International Journal of Sports Physiology and Performance, 11(5), 697-700.' }
    ]
  },
  {
    cat: 'Práctica 4 — Estimador de 1RM (método de dos puntos)',
    items: [
      { cite: 'García-Ramos, A., & Jaric, S. (2018). Two-point method: A quick and fatigue-free procedure for assessment of muscle mechanical capacities. Strength and Conditioning Journal, 40(2), 54-66.', url: 'https://doi.org/10.1519/SSC.0000000000000359' },
      { cite: 'Pérez-Castilla, A., Piepoli, A., Delgado-García, G., Garrido-Blanca, G., & García-Ramos, A. (2021). Reliability and concurrent validity of seven commercially available devices for the assessment of movement velocity at different intensities during the bench press. Journal of Strength and Conditioning Research, 35(5), 1303-1310.', url: 'https://doi.org/10.1519/JSC.0000000000003076' },
      { cite: 'Pérez-Castilla, A., Miras-Moreno, S., Weakley, J., & García-Ramos, A. (2022). Relationship between the load-velocity relationships of full and half back-squat exercises. Journal of Strength and Conditioning Research, 36(11), 2999-3006.' },
      { cite: 'Balsalobre-Fernández, C., García-Ramos, A., & Jiménez-Reyes, P. (2018). Load–velocity profiling in the military press exercise: Effects of gender and training. International Journal of Sports Science & Coaching, 13(5), 743-750.' }
    ]
  },
  {
    cat: 'Práctica 5 — Grado de esfuerzo (%Rep ↔ %PV)',
    items: [
      { cite: 'Sánchez-Medina, L., & González-Badillo, J. J. (2011). Velocity loss as an indicator of neuromuscular fatigue during resistance training. Medicine & Science in Sports & Exercise, 43(9), 1725-1734.', url: 'https://doi.org/10.1249/MSS.0b013e318213f880' },
      { cite: 'Sánchez-Medina, L., Pallarés, J. G., Pérez, C. E., Morán-Navarro, R., & González-Badillo, J. J. (2017). Estimation of relative load from bar velocity in the full back squat exercise. Sports Medicine International Open, 1(2), E80-E88.', url: 'https://doi.org/10.1055/s-0043-102933' },
      { cite: 'Pareja-Blanco, F., Rodríguez-Rosell, D., Sánchez-Medina, L., et al. (2017). Effects of velocity loss during resistance training on athletic performance, strength gains and muscle adaptations. Scandinavian Journal of Medicine & Science in Sports, 27(7), 724-735.' }
    ]
  },
  {
    cat: 'Práctica 6 — Predicción del Máximo Nº de Repeticiones (MNR)',
    items: [
      { cite: 'Sánchez-Moreno, M., Rodríguez-Rosell, D., Pareja-Blanco, F., Mora-Custodio, R., & González-Badillo, J. J. (2017). Movement velocity as indicator of relative intensity and level of effort attained during the set in pull-up exercise. International Journal of Sports Physiology and Performance, 12(10), 1378-1384.' },
      { cite: 'Rodríguez-Rosell, D., Yáñez-García, J. M., Sánchez-Medina, L., Mora-Custodio, R., & González-Badillo, J. J. (2020). Relationship between velocity loss and repetitions in reserve in the bench press and back squat exercises. Journal of Strength and Conditioning Research, 34(9), 2537-2547.' }
    ]
  },
  {
    cat: 'Práctica 7 — Calculadora de RIR',
    items: [
      { cite: 'Weakley, J., Mann, B., Banyard, H., McLaren, S., Scott, T., & García-Ramos, A. (2021). Velocity-based training: From theory to application. Strength and Conditioning Journal, 43(2), 31-49.', url: 'https://doi.org/10.1519/SSC.0000000000000560' },
      { cite: 'Jukic, I., García-Ramos, A., Malecek, J., Omcirk, D., & Tufano, J. J. (2023). The use of lifting straps alters the entire load-velocity profile during the deadlift exercise. Journal of Strength and Conditioning Research, 37(2), 343-348.' },
      { cite: 'Hackett, D. A., Cobley, S. P., Davies, T. B., Michael, S. W., & Halaki, M. (2017). Accuracy in estimating repetitions to failure during resistance exercise. Journal of Strength and Conditioning Research, 31(8), 2162-2168.' }
    ]
  },
  {
    cat: 'Catálogo VML (umbrales de velocidad mínima del 1RM)',
    items: [
      { cite: 'Lake, J., Naworynsky, D., Duncan, F., & Jackson, M. (2017). Comparison of different minimal velocity thresholds to establish deadlift one repetition maximum. Sports, 5(3), 70.' },
      { cite: 'Miras-Moreno, S., Pérez-Castilla, A., Rojas, F. J., Janicijevic, D., Weakley, J., & García-Ramos, A. (2022). Two-point method applied in field conditions: A feasible approach to assess the load-velocity relationship variables during the bench pull exercise. Journal of Strength and Conditioning Research, 36(10), 2606-2613.' },
      { cite: 'García-Ramos, A., Pérez-Castilla, A., Villar Macias, F. J., Latorre-Román, P. Á., Párraga, J. A., & García-Pinillos, F. (2020). Differences in the one-repetition maximum and load-velocity profile between the flat and arched bench press in competitive powerlifters. Sports Biomechanics.' },
      { cite: 'Pérez-Castilla, A., García-Ramos, A., Padial, P., Morales-Artacho, A. J., & Feriche, B. (2023). Load-velocity relationship in variations of the half-squat exercise: Influence of execution technique. Journal of Strength and Conditioning Research, 37(4), 729-736.' }
    ]
  }
];

export function mount(container) {
  clear(container);
  container.appendChild(moduleHeader(
    'Referencias bibliográficas',
    'Bibliografía científica que respalda cada uno de los módulos de VBT Lab. Formato APA 7. Clic sobre el DOI/URL para abrir la fuente original cuando esté disponible.'
  ));

  REFS.forEach(group => {
    container.appendChild(card([
      h('h2', { class: 'font-semibold text-lg mb-4 text-indigo-700 dark:text-indigo-400' }, group.cat),
      h('ol', { class: 'space-y-3 list-decimal list-outside ml-5 text-sm leading-relaxed' },
        group.items.map(it =>
          h('li', { class: 'pl-1' }, [
            h('span', {}, it.cite),
            it.url ? h('div', { class: 'mt-1' }, [
              h('a', {
                href: it.url, target: '_blank', rel: 'noopener noreferrer',
                class: 'text-xs font-mono text-indigo-600 dark:text-indigo-400 hover:underline break-all'
              }, it.url)
            ]) : null,
            it.nota ? h('div', { class: 'mt-1 text-xs italic text-slate-500 dark:text-slate-400' }, it.nota) : null
          ])
        )
      )
    ], 'mt-6'));
  });

  container.appendChild(card([
    h('h2', { class: 'font-semibold text-lg mb-2' }, 'Disclaimer científico'),
    h('p', { class: 'text-sm text-slate-600 dark:text-slate-300' },
      'Esta herramienta es educativa y no sustituye el criterio de un profesional cualificado. Las estimaciones dependen críticamente de la calidad y calibración del transductor de velocidad y del cumplimiento estricto del protocolo de evaluación (técnica, calentamiento, descansos, individualización de la VML).'
    )
  ], 'mt-6'));
}
