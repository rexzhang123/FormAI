# FormAI

## Introduction

FormAI utilizes advanced computer vision and machine learning technologies to analyze and improve golf swings. By providing feedback and suggestions, it helps golfers of all skill levels enhance their form and performance.


## Installation

Before you can run FormAI, you need to install some dependencies and set up required environment variables:

**Install Dependencies**:
   ```bash
   pip install mediapipe opencv-python flask
   ```

**Set Environment Variables**

Open your terminal and run the following command to set your OpenAI API key, replacing yourkey with your actual API key:
   ```bash
   echo "export OPENAI_API_KEY='yourkey'" >> ~/.zshrc
   ```
To set the secret key for your application, replace yoursecretkey with your actual secret key:
   ```bash
echo "export SECRET_KEY='yoursecretkey'" >> ~/.zshrc
   ```
Update your shell with the new variables:
```bash
source ~/.zshrc
```

## Usage

To run FormAI locally, use the Flask command:

```bash

flask run
```
