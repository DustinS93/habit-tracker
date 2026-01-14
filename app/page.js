'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function Home() {
 
const [habits, setHabits] = useState([]);

useEffect(() => {
  async function loadHabits() {
    const { data, error } = await supabase.from('habit_logs')
    .select('*')
    .order('created_at', { ascending: true });

    console.log('Database response:', data, error);

    if (error) {
      console.error('Error loading habits:', error);
    } else {
      const formattedHabits = data.map(row => ({
        id: row.id,
        name: row.habit_name,
        value: row.value,
        category: row.category,
        goal: row.goal
      }));
      
      setHabits(formattedHabits);
    }
  }
  
  loadHabits();
}, []);

const addNewHabit = async () => {
  // Get values from the input fields
  const nameInput = document.getElementById('habitName');
  const categoryInput = document.getElementById('habitCategory');
  const goalInput = document.getElementById('habitGoal');

  const name = nameInput.value.trim();
  const category = categoryInput.value.trim();
  const goal = goalInput.value ? parseInt(goalInput.value) : null;

  // Validate - make sure they entered a name
  if (!name) {
    alert('Please enter a habit name');
    return;
  }

  // Insert into database
  const { data, error } = await supabase
  .from('habit_logs')
  .insert([
    {
      habit_name: name,
      category: category || 'General',
      goal: goal,
      value: 0,
      log_date: new Date().toISOString().split('T')[0]
    }
  ])
  .select();

  if (error) {
    console.error('Error adding habit:', error);
    alert('Failed to add habit');
  } else {
    // Add to local state so it shows up immediately
    const newHabit = {
      id: data[0].id,
      name: data[0].habit_name,
      value: data[0].value,
      category: data[0].category,
      goal: data[0].goal
    };
    setHabits([...habits, newHabit]);

    // Clear the form
    nameInput.value = '';
    categoryInput.value = '';
    goalInput.value = '';
  }
}

const deleteHabit = async (habitId) => {
  console.log('Trying to delete habit with ID:', habitId);

  // Confirm before deleting
  if (!confirm('Are you sure you want to delete this habit?')) {
    return;
  }

  // Delete from data base
  const { error } = await supabase
  .from('habit_logs')
  .delete()
  .eq('id', habitId)
  .select();

  if (error) {
    console.error('Error deleting habit:', error);
    alert('Failed to delete habit');
  } else {
    // Remove from local state
    setHabits(prevHabits => prevHabits.filter(h => h.id !== habitId));
  }
}

  return (
    <main style={{
      padding: '20px',
      fontFamily: 'sans-serif'
    }}>
      <h1>Habit Tracker</h1>
      <p>Today: {new Date().toLocaleDateString()}</p>

      <div style={{
        marginTop: '20px',
        padding: '15px',
        border: '2px solid #212a21ff',
        borderRadius: '8px',
        backgroundColor: '#706e6eff'
      }}>
        <h3 style={{ marginTop: 0 }}>Add New Habit</h3>
        <div style={{ display: 'flex', gap: '10px', flexwrap: 'wrap' }}>
          <input
          type="text"
          placeholder="Habit name"
          id="habitName"
          style={{
            padding: '8px',
            fontSize: '14px',
            border: '1px solid #232323ff',
            borderRadius: '4px',
            flex: '1',
            minWidth: '150px'
          }}
          />
          <input
          type="text"
          placeholder="Category"
          id="habitCategory"
          style={{
            padding: '8px',
            fontSize: '14px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            flex: '1',
            minWidth: '120px'
          }}
          />
          <input
          type="number"
          placeholder="Goal (Optional)"
          id="habitGoal"
          style={{
            padding: '8px',
            fontSize: '14px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            flex: '1',
            minWidth: '120px'
          }}
          />
          <button
          onClick={addNewHabit}
          style={{
            padding: '8px, 16px',
            fontSize: '14px', 
            backgroundColor: '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
          >Add Habit</button>
        </div>
      </div>

      <div
      style={{ 
        marginTop: '20px'
      }}>
        {habits.map((habit) => (
        <div
        key={habit.id} style={{
          padding: '15px',
          marginBottom: '10px',
          border: '1px solid #ddd',
          borderRadius: '5px'
        }}>
          <strong>{habit.name}</strong>
          <button 
          onClick={() => deleteHabit(habit.id)}
          style={{
            marginLeft: '10px',
            padding: '4px 8px',
            fontSize: '12px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
          >Delete</button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginTop: '8px'
          }}>

           <input
           type="number"
           value={habit.value}
           onChange={async (e) => {
            const newValue = parseInt(e.target.value) || 0;

            // Update in state immidiately (for instant UI feedback)
            const updatedHabits = habits.map(h => h.id === habit.id ? { ...h, value: newValue } : h);
            setHabits(updatedHabits);

            // Save to Database
            const { error } = await supabase 
            .from('habit_logs')
            .update({value: newValue })
            .eq('id', habit.id);

            if (error) {
              console.error('Error saving:', error);
            }
           }}
           
           style={{
            padding: '5px',
            fontSize: '20px',
            width: '80px',
            border: '5px solid #102405ff',
            borderRadius: '13px'
           }}
           />
           {habit.goal && <span style={{
            color: '#666'
           }}>/ {habit.goal}</span>}
           </div>
          <small style={{ color: '#666' }}>{habit.category}</small>
          </div>
      ))}
      </div>
    </main>
  )
}