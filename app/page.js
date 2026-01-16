'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function Home() {
 
const [habits, setHabits] = useState([]);

useEffect(() => {
  async function loadHabits() {
    const { data: habitsData, error: habitsError } = await supabase.from('habits')
    .select('*')
    .order('created_at', { ascending: true });

   console.log('Loaded habits:', habitsData);

   //Step 2: Get today's daate in uuu-mm-dd format
   const today = new Date().toISOString().split('T')[0];
   console.log('Today is:', today);

   //Step 3: Get today's logs
   const { data: logsData, error: logsError } = await supabase
   .from('daily_logs')
   .select('*')
   .eq('log_date', today);

   if (logsError) {
    console.log('Error loading logs:', logsError);
   }

   console.log('Today\'s logs:', logsData);

   // Steps: 4 Combine habits with today's values
   const formattedHabits = habitsData.map(habit => {
    // Find if there's a log for this habit today
    const todayLog =logsData?.find(log => log.habit_id === habit.id);

    return {
      id: habit.id, 
      name: habit.name,
      value: todayLog ? todayLog.value : 0,
      category: habit.category, 
      goal: habit.goal
    };
   });

   setHabits(formattedHabits);
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
  .from('habits')
  .insert([
    {
      name: name,
      category: category || "General",
      goal: goal
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
      name: data[0].name,
      value: 0,
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
  .from('habits')
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
      padding: '10px',
      fontFamily: 'sans-serif',
      maxWidth: '100vw',
      boxSizing: 'border-box'

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

            // Update in state immediately (for instant UI feedback)
            const updatedHabits = habits.map(h => h.id === habit.id ? { ...h, value: newValue } : h );
            
            setHabits(updatedHabits);

            // Get today's date
            const today = new Date().toISOString().split('T')[0];

            // Check if a log already exists for this habit today
            const { data: existingLogs } = await supabase
            .from('daily_logs')
            .select('*')
            .eq('habit_id', habit.id)
            .eq('log_date', today)
      
            const existingLog = existingLogs && existingLogs.length > 0 ? existingLogs[0] : null;

            console.log('Checking for existing log:', {habit_id: habit.id, today, existingLogs, existingLog });

           if (existingLog) {
            // Log exists - Update it
            const { error: updateError } = await supabase
            .from('daily_logs')
            .update({ value: newValue })
            .eq('id', existingLog.id);

            if (updateError) {
              console.error('Error updating log:', updateError);
            }
           } else {
            // No log exists - CREATE one
            const { error: insertError } = await supabase
            .from('daily_logs')
            .insert([{
              habit_id: habit.id,
              log_date: today,
              value: newValue
            }]);

            if (insertError) {
              console.error('Error creating log:', insertError);
            }
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