const leads = [];

function handleLeadSubmit(newLead) {
    console.log("leadService: Enviando lead:", newLead); // Línea de depuración
    // Verificar si el lead ya existe para evitar duplicaciones
    const existingLead = leads.find(lead => lead.email === newLead.email && lead.phone === newLead.phone);
    if (!existingLead) {
        leads.push(newLead);
        console.log("leadService: Lead enviado correctamente:", newLead); // Línea de depuración
    } else {
        console.log("leadService: Lead duplicado no agregado:", newLead); // Línea de depuración
    }
}

module.exports = {
    handleLeadSubmit,
};

