/**
 * Catálogo central de imágenes oficiales de Pinturas (Tarros de Pintura)
 * y Materiales / Herramientas / Insumos Pintuco
 */

import tarroPintura from './assets/images/tarro_pintura_1791307236663.jpg';
import tarroFachada from './assets/images/tarro_fachada_1791307438978.jpg';
import tarroEsmalte from './assets/images/tarro_esmalte_1791307452482.jpg';
import tarroGalon from './assets/images/tarro_galon_1791307253090.jpg';

import rodilloPintura from './assets/images/rodillo_pintura_1791307266542.jpg';
import brochaPintura from './assets/images/brocha_pintura_1791307277510.jpg';
import cintaPintor from './assets/images/cinta_pintor_1791307288980.jpg';
import bandejaPintura from './assets/images/bandeja_pintura_1791307300600.jpg';
import espatulaPintor from './assets/images/espatula_pintor_1791307313317.jpg';
import lijaGrano from './assets/images/lija_grano_1791307384139.jpg';
import plasticoCubretodo from './assets/images/plastico_cubretodo_1791307400772.jpg';
import masillaResanador from './assets/images/masilla_resanador_1791307414503.jpg';
import solventeThinner from './assets/images/solvente_thinner_1791307427304.jpg';

export const OFFICIAL_IMAGES = {
  // Tarros de Pintura
  tarroPintura,
  tarroFachada,
  tarroEsmalte,
  tarroGalon,

  // Materiales e Insumos
  rodilloPintura,
  brochaPintura,
  cintaPintor,
  bandejaPintura,
  espatulaPintor,
  lijaGrano,
  plasticoCubretodo,
  masillaResanador,
  solventeThinner,
};

export const PAINT_IMAGE_PRESETS = [
  { label: 'Tarro Cuñete Viniltex (Con Asa)', url: tarroPintura },
  { label: 'Tarro Pintura Exterior Koraza', url: tarroFachada },
  { label: 'Tarro Esmalte Metálico Pintulux', url: tarroEsmalte },
  { label: 'Tarro Galón Tradicional con Tapa', url: tarroGalon },
];

export const MATERIAL_IMAGE_PRESETS = [
  { label: 'Rodillo Texturizado Fachada 9"', url: rodilloPintura },
  { label: 'Brocha Cerda Suave Pintuco', url: brochaPintura },
  { label: 'Cinta de Enmascarar Azul 1"', url: cintaPintor },
  { label: 'Bandeja Plástica para Rodillo 9"', url: bandejaPintura },
  { label: 'Espátula Flexible Acero Inox 3"', url: espatulaPintor },
  { label: 'Pliego Lija de Agua 120/220', url: lijaGrano },
  { label: 'Plástico Protector Cubretodo 4x5m', url: plasticoCubretodo },
  { label: 'Masilla Acrílica Resanadora', url: masillaResanador },
  { label: 'Thinner Fino Solvente Pintuco', url: solventeThinner },
];
