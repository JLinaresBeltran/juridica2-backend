function delayExecution(func, ...args) {
    console.log("inactivityTimer: Inicio de delayExecution"); // Log inicial
    return new Promise(resolve => {
        console.log("inactivityTimer: Configurando timeout de 3 minuto"); // Log para el timeout
        setTimeout(() => {
            console.log("inactivityTimer: Ejecutando función después del delay"); // Log después del delay
            resolve(func(...args));
        }, 60000); // Espera 1 minuto
    });
    console.log("inactivityTimer: Finalización de delayExecution"); // Log final (este no se ejecutará realmente)
}

module.exports = {
    delayExecution,
};