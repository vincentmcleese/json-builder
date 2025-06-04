// Fix the unused error variable
const loadWorkflow = async () => {
  if (!slug) {
    toast.error('No workflow identifier provided');
    navigate('/');
    return;
  }

  try {
    setIsLoading(true);
    
    let { data } = await supabase
      .from('workflows')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (!data && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)) {
      const { data: idData } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', slug)
        .maybeSingle();

      data = idData;
    }

    if (!data) {
      toast.error('Workflow not found');
      navigate('/');
      return;
    }

    if (data.slug && slug !== data.slug) {
      navigate(`/workflow/${data.slug}`, { replace: true });
      return;
    }

    setWorkflow(data);
  } catch (error) {
    console.error('Failed to load workflow:', error);
    toast.error('Failed to load workflow');
    navigate('/');
  } finally {
    setIsLoading(false);
  }
};

export default loadWorkflow