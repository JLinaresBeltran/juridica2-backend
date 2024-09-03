const actionCosts = {
  'telefonia': 1,
  'impugnacion_comparendos': 3,
  'consulta_general': 2,
  'redaccion_documento': 5
  // Añade más acciones y sus costos según sea necesario
};


exports.calculateCost = (action) => {
  return actionCosts[action] || 1; // Costo por defecto si la acción no está definida
};