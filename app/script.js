function addMarkersFromCSV() {
    fetch('worldcities.csv')
        .then(response => response.text())
        .then(data => {
            const lines = data.split('\n');
            lines.forEach(line => {
                const [city, lat, lng] = line.split(';');
                if (city && lat && lng) {
                    L.marker([parseFloat(lat.replace(',', '.')), parseFloat(lng.replace(',', '.'))])
                        .addTo(map)
                        .bindPopup(city);
                }
            });
        })
        .catch(error => console.error('Error reading the CSV file:', error));
}

// Call the function to add markers
addMarkersFromCSV(); 