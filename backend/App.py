from flask import Flask, request, jsonify
import pandas as pd
import pdfplumber
import io
import json
import charset_normalizer


from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Setup basic logging
#logging.basicConfig(level=logging.INFO)

def extract_tables_from_pdf(file_path):
    print("in extract tables")
    tables = []
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            extracted_tables = page.extract_table()
            if extracted_tables:
                tables.extend(extracted_tables)
    print(extracted_tables)            
    return extracted_tables

def tables_to_dataframes(table):
    print("in  tables to df")
    df = pd.DataFrame(table[1:], columns=table[0])  # Skip the header row
    print(df)
    return df
    



def detect_encoding(file):
    raw_data = file.read()
    result = charset_normalizer.detect(raw_data)
    encoding = result['encoding']
    file.seek(0)  # Reset the file pointer to the beginning
    print("def detect_encoding(file):")
    return encoding


@app.route('/upload', methods=['POST'])
def upload_file():
    file = request.files['file']
    file_extension = file.filename.split('.')[-1].lower()
    if file_extension == 'csv':
        print("reading csv")
        encoding = detect_encoding(file)
        df = pd.read_csv(file, encoding=encoding)
        print(df)
    elif file_extension == 'xlsx':
        df = pd.read_excel(file)
    elif file_extension == 'pdf':
        tables = extract_tables_from_pdf(file)
        df = tables_to_dataframes(tables)
        # Print each extracted dataframe
        #for i, df in enumerate(dataframes):
           # print(f"Table {i + 1}:")
            #print(df)
            #print("\n")
    else:
        return "Unsupported file type", 400

    #print(df)
    columns = df.columns.tolist()
    print(columns)

    return jsonify(columns=columns)

@app.route('/selected_columns', methods=['POST'])
def selected_columns():
    data = request.form
    selected_columns = data.getlist('columns[]')
    print(selected_columns)
    file = request.files['file']
    print(file)
   
        
    if not file or not selected_columns:
        return "File or columns not provided", 400
        
    file_extension = file.filename.split('.')[-1].lower()
    if file_extension == 'csv':
        encoding = detect_encoding(file)
        df = pd.read_csv(file, encoding=encoding)
        print("in selected_columns csv df")
        print(df)
    elif file_extension == 'xlsx':
        df = pd.read_excel(file)
    elif file_extension == 'pdf':
        tables = extract_tables_from_pdf(file)
        df = tables_to_dataframes(tables)

    # Print available columns and selected columns for debugging
    print(f"Available columns: {df.columns.tolist()}")
    print(f"Selected columns: {selected_columns}")

    try:
        selected_data = df[selected_columns].to_dict(orient='records')
    except KeyError as e:
        return f"Column selection error: {str(e)}", 400

    # Save selected data to a JSON file
    #json_filename = 'selected_data.json'
    #with open(json_filename, 'w') as json_file:
        #json.dump(selected_data, json_file, indent=4)

    return jsonify(selected_data)

if __name__ == '__main__':
    app.run(debug=True)
