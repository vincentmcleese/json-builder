// Fix the jsonContent error by using it
const handleJsonUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const files = event.target.files;
  if (!files || files.length === 0) return;

  const filePromises = Array.from(files).map(async (file) => {
    try {
      const content = await file.text();
      JSON.parse(content); // Validate JSON without storing result
      
      return {
        name: file.name.replace(/\.json$/, ''),
        content: content
      };
    } catch (error) {
      toast.error(`Failed to parse ${file.name}: Invalid JSON`);
      return null;
    }
  });

  const results = await Promise.all(filePromises);
  const validData = results.filter((result): result is { name: string; content: string } => result !== null);

  if (validData.length === 0) return;

  try {
    const { error } = await supabase
      .from('training_data')
      .insert(validData);

    if (error) throw error;

    loadData();
    toast.success(`Successfully added ${validData.length} training examples`);
    
    // Reset the file input
    event.target.value = '';
  } catch (error) {
    console.error('Failed to add JSON training data:', error);
    toast.error('Failed to add JSON training data');
  }
};