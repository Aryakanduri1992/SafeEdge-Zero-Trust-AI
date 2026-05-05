# LumeEdge Azure Functions Deployment Guide

## Prerequisites

1. **Azure CLI** installed and logged in
2. **Azure Functions Core Tools** v4
3. **Python 3.9+**
4. **Azure Resources Created:**
   - Azure IoT Hub (Free tier)
   - Azure SQL Database (Basic tier)
   - Azure Function App (Flex Consumption)

## Step 1: Create Azure Resources

### Create Resource Group
```bash
az group create --name lumeedge-rg --location eastus
```

### Create Azure SQL Database
```bash
# Create SQL Server
az sql server create \
  --name lumeedge-sql \
  --resource-group lumeedge-rg \
  --location eastus \
  --admin-user lumeedge_admin \
  --admin-password "<YourSecurePassword>"

# Create Database (Basic tier - $5/month)
az sql db create \
  --resource-group lumeedge-rg \
  --server lumeedge-sql \
  --name lumeedge \
  --edition Basic \
  --capacity 5

# Allow Azure services
az sql server firewall-rule create \
  --resource-group lumeedge-rg \
  --server lumeedge-sql \
  --name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

### Create Function App
```bash
# Create Storage Account (required for Functions)
az storage account create \
  --name lumeedgestorage \
  --resource-group lumeedge-rg \
  --location eastus \
  --sku Standard_LRS

# Create Function App (Flex Consumption)
az functionapp create \
  --resource-group lumeedge-rg \
  --consumption-plan-location eastus \
  --runtime python \
  --runtime-version 3.9 \
  --functions-version 4 \
  --name lumeedge-functions \
  --storage-account lumeedgestorage \
  --os-type Linux
```

## Step 2: Initialize Database

Connect to Azure SQL and run the schema:

```bash
# Using sqlcmd
sqlcmd -S lumeedge-sql.database.windows.net -d lumeedge -U lumeedge_admin -P "<password>" -i sql/schema.sql
```

Or use Azure Portal Query Editor.

## Step 3: Configure Application Settings

```bash
# IoT Hub Connection String
az functionapp config appsettings set \
  --name lumeedge-functions \
  --resource-group lumeedge-rg \
  --settings "IoTHubConnectionString=<your-iothub-connection-string>"

# IoT Hub Event Hub Name
az functionapp config appsettings set \
  --name lumeedge-functions \
  --resource-group lumeedge-rg \
  --settings "IoTHubEventHubName=lume-iothub"

# Azure SQL Connection String
az functionapp config appsettings set \
  --name lumeedge-functions \
  --resource-group lumeedge-rg \
  --settings "AzureSqlConnectionString=Server=tcp:lumeedge-sql.database.windows.net,1433;Initial Catalog=lumeedge;Persist Security Info=False;User ID=lumeedge_admin;Password=<password>;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"

# Allowed Device IDs
az functionapp config appsettings set \
  --name lumeedge-functions \
  --resource-group lumeedge-rg \
  --settings "AllowedDeviceIds=lumeedge-001"

# Enable Features
az functionapp config appsettings set \
  --name lumeedge-functions \
  --resource-group lumeedge-rg \
  --settings "EnableAnomalyDetection=true" "EnablePhoneAlerts=false"

# Twilio (Optional)
az functionapp config appsettings set \
  --name lumeedge-functions \
  --resource-group lumeedge-rg \
  --settings "TwilioAccountSid=<sid>" "TwilioAuthToken=<token>" "TwilioPhoneNumber=+1234567890" "AlertPhoneNumber=+1234567890"
```

## Step 4: Deploy Functions

```bash
# From azure-functions directory
func azure functionapp publish lumeedge-functions
```

## Step 5: Configure IoT Hub Routing

1. Go to Azure Portal → IoT Hub → Message routing
2. Add route to Event Hub endpoint (built-in)
3. Ensure messages are routed to the Event Hub compatible endpoint

## Step 6: Verify Deployment

```bash
# Test Dashboard API
curl https://lumeedge-functions.azurewebsites.net/api/dashboard/stats?code=<function-key>

# Test Health Endpoint
curl https://lumeedge-functions.azurewebsites.net/api/dashboard/health?code=<function-key>
```

## Security Best Practices

### Use Managed Identity (Recommended)
```bash
# Enable managed identity
az functionapp identity assign \
  --name lumeedge-functions \
  --resource-group lumeedge-rg

# Grant SQL access
# In Azure SQL, run:
# CREATE USER [lumeedge-functions] FROM EXTERNAL PROVIDER;
# ALTER ROLE db_datareader ADD MEMBER [lumeedge-functions];
# ALTER ROLE db_datawriter ADD MEMBER [lumeedge-functions];
```

### Enable HTTPS Only
```bash
az functionapp update \
  --name lumeedge-functions \
  --resource-group lumeedge-rg \
  --set httpsOnly=true
```

### Configure CORS
```bash
az functionapp cors add \
  --name lumeedge-functions \
  --resource-group lumeedge-rg \
  --allowed-origins "https://your-frontend-domain.com"
```

## Monitoring

### Enable Application Insights
```bash
az monitor app-insights component create \
  --app lumeedge-insights \
  --location eastus \
  --resource-group lumeedge-rg

# Link to Function App
az functionapp config appsettings set \
  --name lumeedge-functions \
  --resource-group lumeedge-rg \
  --settings "APPINSIGHTS_INSTRUMENTATIONKEY=<instrumentation-key>"
```

## Cost Summary

| Resource | SKU | Monthly Cost |
|----------|-----|--------------|
| Function App | Flex Consumption | ~$0 (free tier) |
| IoT Hub | Free | $0 |
| SQL Database | Basic (5 DTU) | ~$5 |
| Storage Account | Standard LRS | ~$0.50 |
| **Total** | | **~$5.50/month** |

## Troubleshooting

### Check Function Logs
```bash
func azure functionapp logstream lumeedge-functions
```

### Test IoT Hub Connection
```bash
# Send test message
az iot device send-d2c-message \
  --hub-name lume-iothub \
  --device-id lumeedge-001 \
  --data '{"device_id":"lumeedge-001","temperature":25.5}'
```

### Verify Database Connection
```bash
# Check if tables exist
sqlcmd -S lumeedge-sql.database.windows.net -d lumeedge -U lumeedge_admin -P "<password>" -Q "SELECT name FROM sys.tables"
```
