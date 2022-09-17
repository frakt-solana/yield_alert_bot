// Get top n values from Object
export const maxValues = async (o, n) => {
    // Get object values and sort descending
    const values = Object.values(o).sort((a, b) => b - a);
    
    // Check if more values exist than number required
    if (values.length <= n) return o;
    
    // Find nth maximum value
    const maxN = values[n - 1];
    
    // Filter object to return only key/value pairs where value >= maxN
    return Object.entries(o)
      .reduce((o, [k, v]) => v >= maxN ? { ...o, [k]: v } : o, {});
}