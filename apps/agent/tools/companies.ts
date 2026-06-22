export interface TargetCompany {
    name: string;
    token: string;
    type: 'lever' | 'greenhouse';
}

export const TARGET_COMPANIES: TargetCompany[] = [
    // Greenhouse
    { name: 'Vercel', token: 'vercel', type: 'greenhouse' },
    { name: 'Figma', token: 'figma', type: 'greenhouse' },
    { name: 'Discord', token: 'discord', type: 'greenhouse' },
    { name: 'Stripe', token: 'stripe', type: 'greenhouse' },
    { name: 'Airbnb', token: 'airbnb', type: 'greenhouse' },
    { name: 'Dropbox', token: 'dropbox', type: 'greenhouse' },
    { name: 'Twilio', token: 'twilio', type: 'greenhouse' },
    { name: 'Datadog', token: 'datadog', type: 'greenhouse' },
    { name: 'Plaid', token: 'plaid', type: 'greenhouse' },
    { name: 'Reddit', token: 'reddit', type: 'greenhouse' },
    { name: 'Gusto', token: 'gusto', type: 'greenhouse' },
    { name: 'Pinterest', token: 'pinterest', type: 'greenhouse' },
    { name: 'Instacart', token: 'instacart', type: 'greenhouse' },
    { name: 'Coinbase', token: 'coinbase', type: 'greenhouse' },
    { name: 'Okta', token: 'okta', type: 'greenhouse' },
    { name: 'Zoom', token: 'zoom', type: 'greenhouse' },
    { name: 'Asana', token: 'asana', type: 'greenhouse' },
    { name: 'Robinhood', token: 'robinhood', type: 'greenhouse' },
    { name: 'DoorDash', token: 'doordash', type: 'greenhouse' },
    { name: 'Lyft', token: 'lyft', type: 'greenhouse' },
    { name: 'Brex', token: 'brex', type: 'greenhouse' },
    { name: 'Ramp', token: 'ramp', type: 'greenhouse' },
    { name: 'Mercury', token: 'mercury', type: 'greenhouse' },
    { name: 'Scale AI', token: 'scale', type: 'greenhouse' },
    { name: 'Loom', token: 'loom', type: 'greenhouse' },

    // Lever
    { name: 'Netflix', token: 'netflix', type: 'lever' },
    { name: 'Atlassian', token: 'atlassian', type: 'lever' },
    { name: 'Yelp', token: 'yelp', type: 'lever' },
    { name: 'Shopify', token: 'shopify', type: 'lever' },
    { name: 'Notion', token: 'notion', type: 'lever' },
    { name: 'Retool', token: 'retool', type: 'lever' },
    { name: 'Canva', token: 'canva', type: 'lever' },
    { name: 'Quora', token: 'quora', type: 'lever' },
    { name: 'Pitch', token: 'pitch', type: 'lever' },
    { name: 'Framer', token: 'framer', type: 'lever' },
    { name: 'Substack', token: 'substack', type: 'lever' },
    { name: 'PostHog', token: 'posthog', type: 'lever' },
    { name: 'Linear', token: 'linear', type: 'lever' },
    { name: 'Raycast', token: 'raycast', type: 'lever' },
    { name: 'Zapier', token: 'zapier', type: 'lever' },
    { name: 'Webflow', token: 'webflow', type: 'lever' },
    { name: 'Auth0', token: 'auth0', type: 'lever' },
    { name: 'Databricks', token: 'databricks', type: 'lever' },
    { name: 'Palantir', token: 'palantir', type: 'lever' },
    { name: 'Roblox', token: 'roblox', type: 'lever' },
    { name: 'OpenAI', token: 'openai', type: 'lever' },
    { name: 'Anthropic', token: 'anthropic', type: 'lever' },
    { name: 'Affirm', token: 'affirm', type: 'lever' },
    { name: 'Patreon', token: 'patreon', type: 'lever' },
    { name: 'Eventbrite', token: 'eventbrite', type: 'lever' }
];
