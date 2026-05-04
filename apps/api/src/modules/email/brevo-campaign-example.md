# ------------------
# Create a campaign
# ------------------
# Include the Brevo library
var SibApiV3Sdk = require('sib-api-v3-sdk');
var defaultClient = SibApiV3Sdk.ApiClient.instance;
# Instantiate the client
var apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = 'YOUR_API_V3_KEY';
var apiInstance = new SibApiV3Sdk.EmailCampaignsApi();
var emailCampaigns = new SibApiV3Sdk.CreateEmailCampaign();
# Define the campaign settings
emailCampaigns.name = "Campaign sent via the API";
emailCampaigns.subject = "My subject";
emailCampaigns.sender = {"name": "From name", "email": "myfromemail@mycompany.com"};
emailCampaigns.type = "classic";
# Content that will be sent
htmlContent: 'Congratulations! You successfully sent this example campaign via the Brevo API.',
# Select the recipients
recipients: {listIds: [2, 7]},
# Schedule the sending in one hour
scheduledAt: '2018-01-01 00:00:01'
