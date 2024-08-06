const fs = require('fs');
const path = require('path');

// Define la ruta base para los archivos de datos
const basePath = path.join(__dirname, '..', 'data');

const saveDataToFile = (filePath, data) => {
    try {
        console.log('fileHelper - saveDataToFile: Iniciando el proceso de guardar datos.'); // Log inicial
        // Verifica si la ruta proporcionada es absoluta; si no, construye la ruta completa
        const isAbsolutePath = path.isAbsolute(filePath);
        console.log(`fileHelper - saveDataToFile: Es ruta absoluta: ${isAbsolutePath}`); // Verificación de ruta absoluta
        const fullPath = isAbsolutePath ? filePath : path.join(basePath, filePath);
        console.log(`fileHelper - saveDataToFile: Ruta completa del archivo: ${fullPath}`); // Ruta completa calculada

        // Verifica si el directorio existe, si no, créalo
        const dirName = path.dirname(fullPath);
        if (!fs.existsSync(dirName)) {
            fs.mkdirSync(dirName, { recursive: true });
            console.log(`fileHelper - saveDataToFile: Directorio creado: ${dirName}`); // Confirmación de creación de directorio
        }

        // Añade los datos al archivo en formato JSON lines
        fs.appendFileSync(fullPath, JSON.stringify(data) + '\n', 'utf8');
        console.log(`fileHelper - saveDataToFile: Datos agregados correctamente en: ${fullPath}`); // Confirmación de guardado de datos
    } catch (error) {
        console.error('fileHelper - saveDataToFile: Error al guardar datos:', error); // Error al guardar datos
        throw new Error('Error al guardar datos: ' + error.message);
    }
};

const loadDataFromFile = (filePath) => {
    try {
        console.log('fileHelper - loadDataFromFile: Iniciando el proceso de cargar datos.'); // Log inicial
        console.log('fileHelper - loadDataFromFile: filePath recibido:', filePath); // Imprimir el filePath recibido

        // Verifica si la ruta proporcionada es absoluta; si no, construye la ruta completa
        const isAbsolutePath = path.isAbsolute(filePath);
        console.log('fileHelper - loadDataFromFile: Es ruta absoluta:', isAbsolutePath); // Depuración para verificar si es una ruta absoluta

        const fullPath = isAbsolutePath ? filePath : path.join(basePath, filePath);
        console.log(`fileHelper - loadDataFromFile: Ruta completa del archivo: ${fullPath}`); // Imprimir la ruta completa calculada

        // Verifica si el archivo existe antes de intentar leerlo
        if (fs.existsSync(fullPath)) {
            console.log(`fileHelper - loadDataFromFile: El archivo existe, procediendo a leer: ${fullPath}`); // Confirmar que el archivo existe

            const rawData = fs.readFileSync(fullPath, 'utf8');
            console.log('fileHelper - loadDataFromFile: Datos crudos leídos del archivo:', rawData); // Imprimir los datos crudos leídos

            const parsedData = JSON.parse(rawData);
            console.log('fileHelper - loadDataFromFile: Datos parseados a JSON:', parsedData); // Imprimir los datos convertidos a JSON

            return parsedData;
        } else {
            console.log(`fileHelper - loadDataFromFile: El archivo no existe: ${fullPath}`); // Añadir un log si el archivo no existe
            return null; // Cambiado de [] a null para reflejar que no se encontró ningún dato
        }
    } catch (error) {
        console.error('fileHelper - loadDataFromFile: Error al cargar datos:', error); // Error al cargar datos
        throw new Error('Error al cargar datos: ' + error.message);
    }
};

module.exports = { saveDataToFile, loadDataFromFile };


