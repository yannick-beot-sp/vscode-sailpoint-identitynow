import { QuickPickItem } from "vscode";

export const LOG_LEVELS: QuickPickItem[] = [{
    label: "ERROR",
    detail: "Designates error events that might still allow the connector to continue."
}, {
    label: "WARN",
    detail: "Designates potentially harmful situations."
}, {
    label: "INFO",
    detail: "Designates information messages that highlight process at a coarse-grain level."
}, {
    label: "DEBUG",
    detail: "Very verbose. Fine grain logging levels used for development and debugging.",
    picked: true
}, {
    label: "TRACE",
    detail: "Most verbose. Finer grain logging levels than debugging."
}]

// Based on https://community.sailpoint.com/t5/IdentityNow-Articles/Enabling-Connector-Logging-in-IdentityNow/ta-p/188107#toc-hId--1810320546
// and https://community.sailpoint.com/t5/Connector-Directory/CCG-Enable-Debug-Log-by-Connector/ta-p/169807
export const LOGGING_CLASSES = [
    {
        connector: "Active Directory - Direct",
        loggingClasses: [
            "sailpoint.connector.ADLDAPConnector",
            "sailpoint.connector.LDAPConnector"
        ]
    },
    {
        "connector": "ACF2 - Full",
        "loggingClasses": [
            "sailpoint.connector.sm.SMConnector"
        ]
    },
    {
        "connector": "ADAM - Direct",
        "loggingClasses": [
            "sailpoint.connector.LDAPConnector"
        ]
    },
    {
        "connector": "AIX - Direct",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter",
            "openconnector.connector.unix.AIXConnector",
            "openconnector.connector.unix.UnixConnector"
        ]
    },
    {
        "connector": "AWS",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter",
            "openconnector.connector.aws"
        ]
    },
    {
        "connector": "AWS Secrets Manager",
        "loggingClasses": [
            "sailpoint.credentials.provider.impl.AWSSecretsManagerProvider"
        ]
    },
    {
        "connector": "Atlassian - Data Center",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter",
            "openconnector.connector.atlassian"
        ]
    },
    {
        "connector": "Atlassian Cloud Jira SDIM",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter",
            "openconnector.connector.atlassian"
        ]
    },
    {
        "connector": "Atlassian Data Center Jira SDIM",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter",
            "openconnector.connector.atlassian"
        ]
    },
    {
        "connector": "Atlassian Server Jira SDIM",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter",
            "openconnector.connector.atlassian"
        ]
    },
    {
        "connector": "Atlassian Suite - Cloud",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter",
            "openconnector.connector.atlassian"
        ]
    },
    {
        "connector": "Azure Active Directory",
        "loggingClasses": [
            "sailpoint.connector.AzureADConnector",
            "sailpoint.connector.azuread"
        ]
    },
    {
        "connector": "BMC Helix ITSM SDIM",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter"
        ]
    },
    {
        "connector": "BMC Helix Remedyforce SDIM",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter"
        ]
    },
    {
        "connector": "BMC Remedy",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter"
        ]
    },
    {
        "connector": "BeyondTrust Password Safe - Cloud",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter"
        ]
    },
    {
        "connector": "BeyondTrust Password Safe - Cloud",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter"
        ]
    },
    {
        "connector": "BeyondTrust Password Safe - On prem",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter"
        ]
    },
    {
        "connector": "BeyondTrust Password Safe - On prem",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter"
        ]
    },
    {
        "connector": "Box",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter",
            "openconnector.connector.BoxNetConnector"
        ]
    },
    {
        "connector": "Coupa",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter",
            "openconnector.connector.coupa.CoupaConnector"
        ]
    },
    {
        "connector": "CyberArk Conjur Cloud",
        "loggingClasses": [
            "sailpoint.credentials.provider.impl.ConjurCloudCyberArkProvider"
        ]
    },
    {
        "connector": "CyberArk PAM Self Hosted",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter"
        ]
    },
    {
        "connector": "CyberArk Privilege Cloud Shared Services",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter"
        ]
    },
    {
        "connector": "Delinea Secret Server Cloud",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter"
        ]
    },
    {
        "connector": "Delinea Secret Server On-Premise",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter"
        ]
    },
    {
        "connector": "Dropbox",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter",
            "openconnector.connector.DropBoxConnector"
        ]
    },
    {
        "connector": "Duo",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter"
        ]
    },
    {
        "connector": "Dynamics 365 Business Central Online",
        "loggingClasses": [
            "sailpoint.connector.BusinessCentralConnector"
        ]
    },
    {
        "connector": "Dynamics 365 Business Central Online",
        "loggingClasses": [
            "sailpoint.connector.BusinessCentralConnector"
        ]
    },
    {
        "connector": "Dynamics 365 CRM",
        "loggingClasses": [
            "sailpoint.connector.DynamicsCRMConnector"
        ]
    },
    {
        "connector": "Dynamics 365 CRM",
        "loggingClasses": [
            "sailpoint.connector.DynamicsCRMConnector"
        ]
    },
    {
        "connector": "Dynamics 365 FO",
        "loggingClasses": [
            "sailpoint.connector.DynamicsFOConnector"
        ]
    },
    {
        "connector": "Epic",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter",
            "openconnector.connector.EPICConnector"
        ]
    },
    {
        "connector": "G Suite",
        "loggingClasses": [
            "openconnector.connector.GoogleAppsDirect",
            "sailpoint.connector.OpenConnectorAdapter"
        ]
    },
    {
        "connector": "Generic",
        "loggingClasses": [
            "sailpoint.connector.DelimitedFileConnector"
        ]
    },
    {
        "connector": "Generic SDIM",
        "loggingClasses": [
            "openconnector.connector.servicedesk.ServiceDeskConnector",
            "connector.sdk.webservices"
        ]
    },
    {
        "connector": "GoToMeeting",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter"
        ]
    },
    {
        "connector": "Guidewire BillingCenter",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter"
        ]
    },
    {
        "connector": "Guidewire ClaimCenter",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter"
        ]
    },
    {
        "connector": "Guidewire ContactManager",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter"
        ]
    },
    {
        "connector": "Guidewire PolicyCenter",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter"
        ]
    },
    {
        "connector": "HashiCorp Vault (Cloud)",
        "loggingClasses": [
            "sailpoint.credential.provider.impl.HashicorpVaultCloudCredentialProvider"
        ]
    },
    {
        "connector": "HashiCorp Vault (On-Premise)",
        "loggingClasses": [
            "sailpoint.credential.provider.impl.HashicorpVaultCredentialProvider"
        ]
    },
    {
        "connector": "IBM DB2",
        "loggingClasses": [
            "sailpoint.connector.DB2WindowsServerConnector"
        ]
    },
    {
        "connector": "IBM Lotus Domino - Direct",
        "loggingClasses": [
            "sailpoint.connector.LotusDomino"
        ]
    },
    {
        "connector": "IBM Tivoli Access Manager",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter"
        ]
    },
    {
        "connector": "IBM Tivoli DS - Direct",
        "loggingClasses": [
            "sailpoint.connector.LDAPConnector"
        ]
    },
    {
        "connector": "IBM i",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter",
            "openconnector.connector.IBMiConnector"
        ]
    },
    {
        "connector": "Ivanti Cherwell",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter"
        ]
    },
    {
        "connector": "Ivanti Cherwell ITSM SDIM",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter"
        ]
    },
    {
        "connector": "JDBC",
        "loggingClasses": [
            "sailpoint.connector.JDBCConnector"
        ]
    },
    {
        "connector": "Jack Henry",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter"
        ]
    },
    {
        "connector": "LDAP",
        "loggingClasses": [
            "sailpoint.connector.LDAPConnector"
        ]
    },
    {
        "connector": "Linux - Direct",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter",
            "openconnector.connector.unix.LinuxConnector",
            "sailpoint.connector.UnixConnector"
        ]
    },
    {
        "connector": "MEDITECH",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter"
        ]
    },
    {
        "connector": "Microsoft Azure SQL Database",
        "loggingClasses": [
            "sailpoint.connector.MSAzureSQLDatabaseConnector"
        ]
    },
    {
        "connector": "Microsoft SQL Server - Direct",
        "loggingClasses": [
            "sailpoint.connector.MSSQLServerConnector",
            "sailpoint.connector.mssql.serviceimpl.MSSQLServerConnectorV2"
        ]
    },
    {
        "connector": "Microsoft SharePoint Online",
        "loggingClasses": [
            "sailpoint.connector.O365SharepointOnlineConnector"
        ]
    },
    {
        "connector": "Microsoft SharePoint Server",
        "loggingClasses": [
            "sailpoint.connector.SharePointServerConnector"
        ]
    },
    {
        "connector": "MongoDB Cloud - Atlas",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter"
        ]
    },
    {
        "connector": "MongoDB Cloud - Database",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter"
        ]
    },
    {
        "connector": "Multi-Host - Microsoft SQL Server",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter"
        ]
    },
    {
        "connector": "Multi-Host - Oracle Database",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter"
        ]
    },
    {
        "connector": "Non-Employee",
        "loggingClasses": [
            "com.sailpoint.connector.NesrConnector"
        ]
    },
    {
        "connector": "Novell eDirectory - Direct",
        "loggingClasses": [
            "sailpoint.connector.LDAPConnector"
        ]
    },
    {
        "connector": "Okta",
        "loggingClasses": [
            "openconnector.connector.okta",
            "sailpoint.connector.OpenConnectorAdapter"
        ]
    },
    {
        "connector": "OpenLDAP - Direct",
        "loggingClasses": [
            "sailpoint.connector.LDAPConnector"
        ]
    },
    {
        "connector": "Oracle Database - Direct",
        "loggingClasses": [
            "sailpoint.connector.OracleDBConnector",
            "sailpoint.connector.JDBCConnector"
        ]
    },
    {
        "connector": "Oracle E-Business",
        "loggingClasses": [
            "sailpoint.connector.OracleEBSConnector",
            "sailpoint.connector.JDBCConnector"
        ]
    },
    {
        "connector": "Oracle EPM Cloud - AR",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter",
            "openconnector.connector.oracleepmcloud"
        ]
    },
    {
        "connector": "Oracle EPM Cloud - FCCS",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter",
            "openconnector.connector.oracleepmcloud"
        ]
    },
    {
        "connector": "Oracle EPM Cloud - NR",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter",
            "openconnector.connector.oracleepmcloud"
        ]
    },
    {
        "connector": "Oracle EPM Cloud - Planning",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter",
            "openconnector.connector.oracleepmcloud"
        ]
    },
    {
        "connector": "Oracle ERP Cloud",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter"
        ]
    },
    {
        "connector": "Oracle Fusion HCM Accounts",
        "loggingClasses": [
            "openconnector.connector.oraclefusionhcm",
            "sailpoint.connector.OpenConnectorAdapter"
        ]
    },
    {
        "connector": "Oracle HCM Cloud",
        "loggingClasses": [
            "sailpoint.connector.oraclehcmcloud.OracleHCMCloudConnector"
        ]
    },
    {
        "connector": "Oracle HRMS",
        "loggingClasses": [
            "sailpoint.connector.OracleAppsHRMSConnector"
        ]
    },
    {
        "connector": "Oracle Internet Directory - Direct",
        "loggingClasses": [
            "sailpoint.connector.LDAPConnector"
        ]
    },
    {
        "connector": "Oracle NetSuite",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter"
        ]
    },
    {
        "connector": "PeopleSoft - Direct",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter",
            "openconnector.connector.PeopleSoftConnector"
        ]
    },
    {
        "connector": "PeopleSoft HCM Database",
        "loggingClasses": [
            "sailpoint.connector.PeopleSoftHRMSConnector"
        ]
    },
    {
        "connector": "RACF - Full",
        "loggingClasses": [
            "sailpoint.connector.sm.SMConnector"
        ]
    },
    {
        "connector": "RACF LDAP",
        "loggingClasses": [
            "sailpoint.connector.LDAPConnector"
        ]
    },
    {
        "connector": "RSA Authentication Manager - Direct",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter",
            "openconnector.connector.RSAConnector",
            "openconnector.connector.rsa.RSAHTTPClient",
            "openconnector.connector.rsa"
        ]
    },
    {
        "connector": "RemedyForce",
        "loggingClasses": [
            "sailpoint.connector.ForceConnector"
        ]
    },
    {
        "connector": "SAML-JIT",
        "loggingClasses": [
            "com.sailpoint.connector.SamlJitConnector"
        ]
    },
    {
        "connector": "SAP - Direct",
        "loggingClasses": [
            "sailpoint.connector.SAPConnector",
            "sailpoint.connector.SAPInternalConnector"
        ]
    },
    {
        "connector": "SAP Analytics Cloud",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter"
        ]
    },
    {
        "connector": "SAP Concur",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter"
        ]
    },
    {
        "connector": "SAP Fieldglass",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter"
        ]
    },
    {
        "connector": "SAP GRC",
        "loggingClasses": [
            "sailpoint.connector.SAPGRCConnector",
            "sailpoint.connector.sapgrc"
        ]
    },
    {
        "connector": "SAP HANA Database",
        "loggingClasses": [
            "sailpoint.connector.SAPHANAConnector"
        ]
    },
    {
        "connector": "SAP HR/HCM",
        "loggingClasses": [
            "sailpoint.connector.SAPHRConnector",
            "sailpoint.connector.SAPHRInternalConnector"
        ]
    },
    {
        "connector": "SAP Portal - UMWebService",
        "loggingClasses": [
            "sailpoint.connector.SAPPortalSOAPConnector"
        ]
    },
    {
        "connector": "SAP S/4HANA Cloud",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter"
        ]
    },
    {
        "connector": "SCIM 1.1",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter",
            "openconnector.connector.SCIMConnector"
        ]
    },
    {
        "connector": "SCIM 2.0",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter",
            "openconnector.connector.scim2.SCIM2Connector"
        ]
    },
    {
        "connector": "SQLLoader",
        "loggingClasses": [
            "sailpoint.connector.JDBCConnector"
        ]
    },
    {
        "connector": "Salesforce",
        "loggingClasses": [
            "sailpoint.connector.ForceConnector",
            "sailpoint.connector.salesforce",
            "sailpoint.connector.SalesForceConnector"
        ]
    },
    {
        "connector": "ServiceNow",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter",
            "openconnector.connector.servicenow"
        ]
    },
    {
        "connector": "ServiceNow SDIM",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter",
            "openconnector.connector.servicedesk"
        ]
    },
    {
        "connector": "ServiceNow Service Desk",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter"
        ]
    },
    {
        "connector": "Siebel",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter",
            "openconnector.connector.SiebelConnector"
        ]
    },
    {
        "connector": "Slack",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter"
        ]
    },
    {
        "connector": "Snowflake",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter",
            "openconnector.connector.snowflake"
        ]
    },
    {
        "connector": "Solaris - Direct",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter",
            "openconnector.connector.unix.SolarisConnector",
            "openconnector.connector.unix.UnixConnector"
        ]
    },
    {
        "connector": "SuccessFactors",
        "loggingClasses": [
            "sailpoint.connector.SuccessFactorsConnector"
        ]
    },
    {
        "connector": "SuccessFactors LMS",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter"
        ]
    },
    {
        "connector": "Sybase - Direct",
        "loggingClasses": [
            "sailpoint.connector.SybaseDirectConnector",
            "sailpoint.connector.JDBCConnector"
        ]
    },
    {
        "connector": "Top Secret LDAP",
        "loggingClasses": [
            "sailpoint.connector.TSSLDAPConnector"
        ]
    },
    {
        "connector": "TopSecret - Full",
        "loggingClasses": [
            "sailpoint.connector.sm.SMConnector"
        ]
    },
    {
        "connector": "UKG Pro Core HCM",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter"
        ]
    },
    {
        "connector": "Web Services",
        "loggingClasses": [
            "sailpoint.connector.webservices",
            "connector.sdk.webservices",
        ]
    },
    {
        "connector": "Webex",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter",
            "openconnector.connector.Webex"
        ]
    },
    {
        "connector": "Windows Local - Direct",
        "loggingClasses": [
            "sailpoint.connector.NTConnector"
        ]
    },
    {
        "connector": "Workday",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter",
            "openconnector.connector.WorkDay"
        ]
    },
    {
        "connector": "Workday Accounts",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter",
            "openconnector.connector.workdayaccounts",
            "openconnector.connector.workdayaccounts.WorkdayAccountsConnector"
        ]
    },
    {
        "connector": "Zendesk",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter"
        ]
    },
    {
        "connector": "Zendesk SDIM",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter"
        ]
    },
    {
        "connector": "Zoom",
        "loggingClasses": [
            "sailpoint.connector.OpenConnectorAdapter",
            "openconnector.connector.zoom.ZoomConnector"
        ]
    }
]