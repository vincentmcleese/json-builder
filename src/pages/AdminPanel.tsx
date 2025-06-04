import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';

interface TrainingData {
  id: string;
  name: string;
  content: string;
  created_at: string;
}

const AdminPanel: React.FC = () => {
  const [trainingData, setTrainingData] = useState<TrainingData[]>([]);

  const loadTrainingData = async () => {
    try {
      const { data, error } = await supabase
        .from('training_data')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTrainingData(data || []);
    } catch (error) {
      console.error('Error loading training data:', error);
      toast.error('Failed to load training data');
    }
  };

  useEffect(() => {
    loadTrainingData();
  }, []);

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

      loadTrainingData();
      toast.success(`Successfully added ${validData.length} training examples`);
      
      // Reset the file input
      event.target.value = '';
    } catch (error) {
      console.error('Failed to add JSON training data:', error);
      toast.error('Failed to add JSON training data');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Upload Training Data</h2>
        <input
          type="file"
          accept=".json"
          multiple
          onChange={handleJsonUpload}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Training Data</h2>
        <div className="grid gap-4">
          {trainingData.map((item) => (
            <div key={item.id} className="border rounded p-4">
              <h3 className="font-medium">{item.name}</h3>
              <p className="text-sm text-gray-500">
                Added: {new Date(item.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;