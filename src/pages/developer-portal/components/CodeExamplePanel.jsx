import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const CodeExamplePanel = ({ endpoint }) => {
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [copied, setCopied] = useState(false);

  const codeExamples = {
    javascript: `// AYUSH Terminology Service - ${endpoint?.title || 'API Example'}
const axios = require('axios');

const config = {
  method: '${endpoint?.method?.toLowerCase() || 'get'}',
  url: 'https://api.ayush-terminology.gov.in${endpoint?.path || '/api/v1/terminology/search'}',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
    'Accept': 'application/fhir+json'
  }${endpoint?.method === 'POST' ? `,
  data: {
    "query": "fever",
    "system": "NAMASTE",
    "limit": 10
  }` : ''}
};

axios(config)
  .then(response => {
    console.log('Response:', response.data);
  })
  .catch(error => {
    console.error('Error:', error.response?.data || error.message);
  });`,

    python: `# AYUSH Terminology Service - ${endpoint?.title || 'API Example'}
import requests
import json

url = "https://api.ayush-terminology.gov.in${endpoint?.path || '/api/v1/terminology/search'}"

headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json",
    "Accept": "application/fhir+json"
}

${endpoint?.method === 'POST' ? `data = {
    "query": "fever",
    "system": "NAMASTE",
    "limit": 10
}

response = requests.${endpoint?.method?.toLowerCase() || 'get'}(url, headers=headers, json=data)` : `response = requests.${endpoint?.method?.toLowerCase() || 'get'}(url, headers=headers)`}

if response.status_code == 200:
    result = response.json()
    print("Success:", json.dumps(result, indent=2))
else:
    print(f"Error {response.status_code}:", response.text)`,

    java: `// AYUSH Terminology Service - ${endpoint?.title || 'API Example'}
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URI;
import java.time.Duration;

public class AyushTerminologyClient {
    private static final String BASE_URL = "https://api.ayush-terminology.gov.in";
    private static final String API_KEY = "YOUR_API_KEY";
    
    public static void main(String[] args) {
        HttpClient client = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
            
        HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
            .uri(URI.create(BASE_URL + "${endpoint?.path || '/api/v1/terminology/search'}"))
            .header("Authorization", "Bearer " + API_KEY)
            .header("Content-Type", "application/json")
            .header("Accept", "application/fhir+json")
            .timeout(Duration.ofSeconds(30));
            
        ${endpoint?.method === 'POST' ? `String jsonBody = "{\\"query\\":\\"fever\\",\\"system\\":\\"NAMASTE\\",\\"limit\\":10}";
        HttpRequest request = requestBuilder.POST(HttpRequest.BodyPublishers.ofString(jsonBody)).build();` : `HttpRequest request = requestBuilder.GET().build();`}
        
        try {
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            System.out.println("Status: " + response.statusCode());
            System.out.println("Response: " + response.body());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}`,

    curl: `# AYUSH Terminology Service - ${endpoint?.title || 'API Example'}
curl -X ${endpoint?.method?.toUpperCase() || 'GET'} \\
  'https://api.ayush-terminology.gov.in${endpoint?.path || '/api/v1/terminology/search'}' \\
  -H 'Authorization: Bearer YOUR_API_KEY'\ -H'Content-Type: application/json'\ -H'Accept: application/fhir+json'${endpoint?.method === 'POST' ? ` \\
  -d '{
    "query": "fever",
    "system": "NAMASTE",
    "limit": 10
  }'` : ''}`
  };

  const languages = [
    { id: 'javascript', name: 'JavaScript', icon: 'FileText' },
    { id: 'python', name: 'Python', icon: 'FileText' },
    { id: 'java', name: 'Java', icon: 'FileText' },
    { id: 'curl', name: 'cURL', icon: 'Terminal' }
  ];

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard?.writeText(codeExamples?.[selectedLanguage]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg clinical-shadow">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-text-primary">Code Examples</h3>
          <Button
            variant="ghost"
            size="sm"
            iconName={copied ? "Check" : "Copy"}
            iconPosition="left"
            onClick={copyToClipboard}
            className="text-text-secondary"
          >
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>
        
        <div className="flex items-center space-x-2 mt-3">
          {languages?.map((lang) => (
            <button
              key={lang?.id}
              onClick={() => setSelectedLanguage(lang?.id)}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium clinical-transition ${
                selectedLanguage === lang?.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-text-secondary hover:text-text-primary hover:bg-muted'
              }`}
            >
              <Icon name={lang?.icon} size={14} />
              <span>{lang?.name}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="p-0">
        <div className="bg-slate-900 rounded-b-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-800">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <span className="text-sm text-slate-300 ml-3">{languages?.find(l => l?.id === selectedLanguage)?.name}</span>
            </div>
          </div>
          
          <div className="p-4 overflow-x-auto">
            <pre className="text-sm text-slate-100 font-mono leading-relaxed">
              <code>{codeExamples?.[selectedLanguage]}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeExamplePanel;