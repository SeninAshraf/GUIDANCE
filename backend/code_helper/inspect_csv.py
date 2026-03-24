import pandas as pd
df = pd.read_csv('leetcode.csv')
print("Columns:", df.columns.tolist())
print("\nUnique Topics (first 20):")
topics = df['related_topics'].dropna().unique()
print(topics[:20])

print("\nDifficulty counts:")
print(df['difficulty'].value_counts())

# Check for SQL like questions
print("\nQuestions containing 'SQL' or 'Database':")
sql_mask = df['description'].fillna('').str.contains('SQL|Database', case=False) | df['title'].fillna('').str.contains('SQL|Database', case=False)
print(df[sql_mask][['title', 'difficulty']].head())
