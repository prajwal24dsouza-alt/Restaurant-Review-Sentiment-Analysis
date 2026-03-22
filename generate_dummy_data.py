import pandas as pd
import numpy as np

def generate_random_restaurant_data(num_rows=10000, filename='restaurant_data.csv'):
    print(f"Generating {num_rows} rows of sample restaurant data...")
    
    cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose']
    cuisines = ['Italian', 'Mexican', 'Chinese', 'Indian', 'American', 'Japanese', 'Thai', 'French', 'Mediterranean', 'Korean']
    
    # Generate random data
    np.random.seed(42) # For reproducibility
    
    data = {
        'Restaurant_ID': range(1, num_rows + 1),
        'Name': [f"Restaurant_{i}" for i in range(1, num_rows + 1)],
        'City': np.random.choice(cities, num_rows),
        'Cuisine': np.random.choice(cuisines, num_rows),
        'Rating': np.round(np.random.normal(loc=3.8, scale=0.7, size=num_rows), 1), # Normal distribution around 3.8
        'Votes': np.random.randint(0, 5000, num_rows),
        'Cost': np.random.randint(10, 150, num_rows) # Cost for two
    }
    
    # Cap ratings between 1.0 and 5.0
    data['Rating'] = np.clip(data['Rating'], 1.0, 5.0)
    
    # Create DataFrame
    df = pd.DataFrame(data)
    
    # Introduce some realistic missing data
    df.loc[np.random.choice(df.index, 100), 'Rating'] = np.nan
    df.loc[np.random.choice(df.index, 50), 'Cost'] = np.nan
    
    # Save to CSV
    df.to_csv(filename, index=False)
    print(f"Successfully saved sample dataset to '{filename}'.")

if __name__ == "__main__":
    generate_random_restaurant_data()
