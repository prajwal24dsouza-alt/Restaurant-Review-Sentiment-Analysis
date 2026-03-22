import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
import os

# Set visualization style for nicer plots
sns.set_theme(style="whitegrid")

def analyze_restaurant_data(file_path):
    """Loads, cleans, analyzes, and visualizes restaurant data."""
    
    print(f"--- Starting Analysis on {file_path} ---")
    
    # 1. LOAD DATA
    if not os.path.exists(file_path):
        print(f"Error: Could not find '{file_path}'. Please check the path.")
        return
        
    df = pd.read_csv(file_path)
    print(f"Data initially loaded successfully. Total Rows: {df.shape[0]}, Total Columns: {df.shape[1]}")
    
    # 2. DATA CLEANING
    print("\n[Cleaning Data...]")
    # Drop duplicates
    initial_rows = len(df)
    df = df.drop_duplicates()
    if initial_rows - len(df) > 0:
        print(f"  - Dropped {initial_rows - len(df)} duplicate rows.")
    
    # Handle missing values (Fill numeric with median, dropping others can be customized)
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    missing_numeric = df[numeric_cols].isnull().sum().sum()
    if missing_numeric > 0:
        df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].median())
        print(f"  - Filled {missing_numeric} missing numeric values with the column median.")

    # 3. BASIC STATISTICAL SUMMARY
    print("\n[Data Summary...]")
    if 'Rating' in df.columns:
        print(f"  - Minimum Rating: {df['Rating'].min()}")
        print(f"  - Average Rating: {df['Rating'].mean():.2f}")
        print(f"  - Maximum Rating: {df['Rating'].max()}")
        
    if 'Cost' in df.columns:
        print(f"  - Average Cost: ${df['Cost'].mean():.2f}")
        print(f"  - Max Cost: ${df['Cost'].max():.2f}")

    # 4. VISUALIZATION DASHBOARD
    print("\n[Generating Visualizations...]")
    
    # Create a 2x2 grid of subplots
    fig, axes = plt.subplots(2, 2, figsize=(16, 12))
    fig.suptitle('Restaurant Dataset Analytics Dashboard', fontsize=22, fontweight='bold', y=0.98)

    # Note: Column names 'Rating', 'Cuisine', 'Cost', 'City' are assumed. 
    # Change these strings to match your actual CSV headers if they differ!

    # A. Distribution of Ratings (Histogram)
    if 'Rating' in df.columns:
        sns.histplot(df['Rating'], bins=20, kde=True, ax=axes[0, 0], color='skyblue')
        axes[0, 0].set_title('Distribution of Restaurant Ratings', fontsize=14)
        axes[0, 0].set_xlabel('Rating (Out of 5)')
        axes[0, 0].set_ylabel('Number of Restaurants')

    # B. Top 10 Cuisines (Bar Chart)
    if 'Cuisine' in df.columns:
        top_cuisines = df['Cuisine'].value_counts().head(10)
        sns.barplot(x=top_cuisines.values, y=top_cuisines.index, ax=axes[0, 1], hue=top_cuisines.index, palette='viridis', legend=False)
        axes[0, 1].set_title('Top 10 Most Common Cuisines', fontsize=14)
        axes[0, 1].set_xlabel('Number of Restaurants')
        axes[0, 1].set_ylabel('Cuisine Type')

    # C. Cost vs Rating (Scatter Plot)
    if 'Cost' in df.columns and 'Rating' in df.columns:
        sns.scatterplot(data=df, x='Cost', y='Rating', alpha=0.4, ax=axes[1, 0], color='coral', edgecolor=None)
        axes[1, 0].set_title('Correlation: Cost vs. Rating', fontsize=14)
        axes[1, 0].set_xlabel('Cost')
        axes[1, 0].set_ylabel('Rating')

    # D. Top 10 Cities with most restaurants (Bar Chart)
    if 'City' in df.columns:
        top_cities = df['City'].value_counts().head(10)
        sns.barplot(x=top_cities.index, y=top_cities.values, ax=axes[1, 1], hue=top_cities.index, palette='magma', legend=False)
        axes[1, 1].set_title('Top 10 Cities by Restaurant Count', fontsize=14)
        axes[1, 1].set_xlabel('City')
        axes[1, 1].set_ylabel('Number of Restaurants')
        axes[1, 1].tick_params(axis='x', rotation=45)

    # Adjust layout to prevent overlapping
    plt.tight_layout(rect=[0, 0.03, 1, 0.95])
    
    # Save the figure to the current directory
    output_filename = 'restaurant_dashboard.png'
    plt.savefig(output_filename, dpi=300)
    print(f"  => Plot saved locally as '{output_filename}'")
    
    # Show the plot window
    plt.show()

if __name__ == "__main__":
    # If your dataset has a different name, change it here!
    DATASET_FILENAME = 'restaurant_data.csv'
    
    analyze_restaurant_data(DATASET_FILENAME)
