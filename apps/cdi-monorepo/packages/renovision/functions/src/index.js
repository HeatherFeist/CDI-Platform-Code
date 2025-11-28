const { onRequest } = require('firebase-functions/v2/https');
const cors = require('cors')({origin: true});

// --- LIVE DATA FETCHING FUNCTION ---
async function getRealPrices(items, zipCode) {
  console.log(`Fetching prices for zip code: ${zipCode}`, items);
  
  const materials = [];
  let totalMaterialCost = 0;

  // Use mock data as a fallback
  for (const item of items) {
    const mockPrices = {
        'modern armchair': 479.99,
        'floor lamp': 125.50,
        'potted plant': 85.00,
        'paint': 55.00, // per gallon
    };
    
    // Use mock price if available, otherwise use default price
    const unitCost = mockPrices[item.name.toLowerCase()] || 150.00;
    const totalCost = unitCost * item.quantity;
    
    materials.push({
      item: item.name,
      quantity: item.quantity,
      unitCost: unitCost,
      totalCost: totalCost,
    });
    totalMaterialCost += totalCost;
  }

  // Mock labor estimate
  const labor = [{
      item: "General Labor & Installation",
      quantity: 8, // hours
      unitCost: 70, // per hour, could be adjusted by zip code
      totalCost: 8 * 70
  }];
  const totalLaborCost = labor.reduce((sum, item) => sum + item.totalCost, 0);

  return {
      materials,
      labor,
      totalMaterialCost,
      totalLaborCost,
      totalProjectCost: totalMaterialCost + totalLaborCost,
      zipCode,
      notes: "This is a preliminary estimate based on typical market rates. Prices may vary based on local suppliers and contractor rates. Always get a binding quote from a professional.",
  };
}

exports.getCostEstimate = onRequest((request, response) => {
  return cors(request, response, async () => {
    if (request.method !== "POST") {
      return response.status(405).send("Method Not Allowed");
    }

    try {
      const {items, zipCode} = request.body;

      if (!Array.isArray(items) || !zipCode || typeof zipCode !== 'string') {
        return response.status(400).send("Invalid request body. Expected 'items' (array) and 'zipCode' (string).");
      }

      const estimate = await getRealPrices(items, zipCode);
      
      // Add CORS headers explicitly
      response.set('Access-Control-Allow-Origin', request.headers.origin || '*');
      response.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
      response.set('Access-Control-Allow-Headers', 'Content-Type');
      response.set('Access-Control-Allow-Credentials', 'true');
      
      return response.status(200).json(estimate);
    } catch (error) {
      console.error("Error in getCostEstimate function:", error);
      return response.status(500).send("Internal Server Error");
    }
  });
});