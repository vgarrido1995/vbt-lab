/*
 * js/data/ejercicios.js
 * Catálogo de ejercicios con su Velocidad Mínima asociada al 1RM (VML, "minimal velocity threshold").
 * Estos VML son críticos para el módulo Estimador de 1RM (Práctica 4).
 * Si el transductor o protocolo del usuario difiere, la UI permite sobrescribir manualmente.
 */
export const EJERCICIOS = [
  { id: 'press_banca_smith',   nombre: 'Press de banca (máquina Smith)', vml: 0.17, modalidad: 'tren superior',          referencia: 'Pérez-Castilla et al., 2021' },
  { id: 'press_banca_libre',   nombre: 'Press de banca (peso libre)',    vml: 0.17, modalidad: 'tren superior',          referencia: 'García-Ramos & Jaric, 2018' },
  { id: 'sentadilla_completa', nombre: 'Sentadilla completa',            vml: 0.30, modalidad: 'tren inferior',          referencia: 'Pérez-Castilla et al., 2022' },
  { id: 'sentadilla_paralela', nombre: 'Sentadilla paralela',            vml: 0.32, modalidad: 'tren inferior',          referencia: 'Sánchez-Medina et al., 2017' },
  { id: 'press_militar',       nombre: 'Press militar / hombro',         vml: 0.18, modalidad: 'tren superior',          referencia: 'Balsalobre-Fernández et al., 2018' },
  { id: 'remo_tumbado',        nombre: 'Remo tumbado prono',             vml: 0.50, modalidad: 'tren superior tracción', referencia: 'Miras-Moreno et al., 2022' },
  { id: 'remo_invertido',      nombre: 'Remo invertido',                 vml: 0.50, modalidad: 'tren superior tracción', referencia: 'Pérez-Castilla et al., 2023b' },
  { id: 'peso_muerto',         nombre: 'Peso muerto convencional',       vml: 0.14, modalidad: 'cadena posterior',       referencia: 'Lake et al., 2017' },
  { id: 'dominada',            nombre: 'Dominada con lastre',            vml: 0.23, modalidad: 'tren superior tracción', referencia: 'Sánchez-Moreno et al., 2017' },
  { id: 'hip_thrust',          nombre: 'Hip thrust',                     vml: 0.30, modalidad: 'cadena posterior',       referencia: 'García-Ramos et al., 2020' }
];

export function getEjercicio(id) {
  return EJERCICIOS.find(e => e.id === id) || EJERCICIOS[0];
}
