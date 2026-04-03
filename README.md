# Welcome to Your Equinox

<div align="center">
<img width="267" height="100" alt="Your Equinox Logo" src="https://github.com/user-attachments/assets/ef7eea49-a6be-47a0-aa2c-19580ed117df" />
</div>

Your Equinox(YE) serves as your personal productivity app that will steer you in the proper direction to acquire the desired outcome that you want whether it is learning a new subject or helping you keep track of your tasks. 

### ✨Core Features

- Active Learning Tools(Ai assisted learning, quiz generation)
- Calendar: Visual schedule that automatically syncs your study reviews and reminders.
- Note Taking Capabilities: Block-based text editor featuring Markdown support, LaTeX math equations, and image uploads.
- Task and Reminder System: Keep track of daily intentions and action item

## Logging into YE through our website

### Requirements
- Email Address
- Your password(recommended to make a strong password)

## How to run YE locally

### Requirements
- Coding Environment (e.g Visual Code, Webstorm)
- Google Gemini API KEY
- Node.js 
- Supabase (your own local supabase)

### Setting up Supabase

### Getting Started Locally
Here are the following steps should you wish to copy this system locally to your system if you wish to not use our system

1. Clone the repository using your terminal or gitbash

```
git clone https://github.com/Your-Equinox/YE-Application.git 
```
<img width="776" height="216" alt="image" src="https://github.com/user-attachments/assets/362b612d-b524-4153-847d-559c08ee121c" />

2. Open the YE application using your code environment

3. Install the necessary prequisites using the following commands into your terminal within your coding environment.
```
npm install
```
<img width="1508" height="521" alt="image" src="https://github.com/user-attachments/assets/709e4d79-e9de-4e8c-9197-f7ba8658564b" />

4. Paste either of the following commands into your terminal  to start your own local version of the application

This is to start on your own local system
```
npm run dev
```
<img width="351" height="192" alt="image" src="https://github.com/user-attachments/assets/ef2f105a-848e-44d8-9a28-d2cf26edc9b2" />


This is to host YE over the internet if that is your wish 
```
npm run dev -- --host
```
<img width="393" height="223" alt="image" src="https://github.com/user-attachments/assets/1adabb94-06e8-414e-bfbb-467a62c5b5f2" />

5. Login using your own custom credentials (Note: In your browser if you are not brought to the authentication put in (Ex: http://localhost:5173/auth.html))

6. Welcome to YE locally!!

### Setting up your Google Gemini API Key

To obtain access any of the quiz material a google gemini API key is required. This key is stored locally on your system so in the event that you need to move to another browser this process must be repeated 

1. Head to google ai studio: https://aistudio.google.com/prompts/new_chat
2. Log into google ai studio if you have not already
3. Click on Get Api Key
<img width="2762" height="1380" alt="image" src="https://github.com/user-attachments/assets/09259928-2463-4378-9dec-e7f7dbc81217" />
5. Click Create Api Key and leave the default settings
<img width="2122" height="288" alt="image" src="https://github.com/user-attachments/assets/0045379f-f2a4-4823-bb2a-0848facbda5f" />
7. Copy your API key and head to settings
<img width="2080" height="506" alt="image" src="https://github.com/user-attachments/assets/1203dd4e-08d1-4823-bf6f-1b7058c8f17d" />
8. In Settings click on ✨ AI Assistant and paste your API key into the dedicated area and press store key
<img width="2676" height="1104" alt="image" src="https://github.com/user-attachments/assets/d9dff41a-f4f5-4506-a71c-7bd257b18e3c" />
<img width="2780" height="1580" alt="image" src="https://github.com/user-attachments/assets/b0880822-bc45-40e3-a36b-95e680d8b518" />


## Application Preview
<img width="2780" height="3874" alt="image" src="https://github.com/user-attachments/assets/165cba94-8e95-40cc-9ae7-260bb66075ad" />
<img width="2780" height="1580" alt="image" src="https://github.com/user-attachments/assets/15d80699-0d8a-4bc1-9ed5-b5757b89913a" />
<img width="2780" height="1772" alt="image" src="https://github.com/user-attachments/assets/075f64a4-c948-4c8c-bffb-c096081973b5" />



## Resources for trouble shooting
Node: https://nodejs.org/learn/getting-started/debugging

Vite: https://vite.dev/guide/troubleshooting

