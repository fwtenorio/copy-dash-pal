# Migration Instructions - Integration Status Fields

## ⚠️ CRITICAL: This migration MUST be applied before testing pause/resume functionality

The pause/resume feature requires new status fields in the database. If you're experiencing issues where the integration stays "Paused" and won't activate, it's likely because this migration hasn't been applied yet.

## How to Apply the Migration

### Option 1: Supabase Dashboard (Recommended)

1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor** in the sidebar
4. Click **New Query**
5. Copy and paste the SQL below
6. Click **Run** or press `Ctrl+Enter`

```sql
-- Add status fields for integrations to support pause/resume functionality
-- Status values: 'active' (default when connected), 'paused', or NULL (not connected)

ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS shopify_status TEXT CHECK (shopify_status IN ('active', 'paused')),
ADD COLUMN IF NOT EXISTS woocommerce_status TEXT CHECK (woocommerce_status IN ('active', 'paused')),
ADD COLUMN IF NOT EXISTS stripe_status TEXT CHECK (stripe_status IN ('active', 'paused')),
ADD COLUMN IF NOT EXISTS paypal_status TEXT CHECK (paypal_status IN ('active', 'paused')),
ADD COLUMN IF NOT EXISTS klarna_status TEXT CHECK (klarna_status IN ('active', 'paused')),
ADD COLUMN IF NOT EXISTS airwallex_status TEXT CHECK (airwallex_status IN ('active', 'paused')),
ADD COLUMN IF NOT EXISTS woopayments_status TEXT CHECK (woopayments_status IN ('active', 'paused')),
ADD COLUMN IF NOT EXISTS braintree_status TEXT CHECK (braintree_status IN ('active', 'paused')),
ADD COLUMN IF NOT EXISTS adyen_status TEXT CHECK (adyen_status IN ('active', 'paused')),
ADD COLUMN IF NOT EXISTS wix_status TEXT CHECK (wix_status IN ('active', 'paused')),
ADD COLUMN IF NOT EXISTS magento_status TEXT CHECK (magento_status IN ('active', 'paused'));

-- Set default status 'active' for existing connected integrations
UPDATE public.clients SET shopify_status = 'active' WHERE shopify_connected_at IS NOT NULL AND shopify_status IS NULL;
UPDATE public.clients SET woocommerce_status = 'active' WHERE woocommerce_connected_at IS NOT NULL AND woocommerce_status IS NULL;
UPDATE public.clients SET stripe_status = 'active' WHERE stripe_connected_at IS NOT NULL AND stripe_status IS NULL;
UPDATE public.clients SET paypal_status = 'active' WHERE paypal_connected_at IS NOT NULL AND paypal_status IS NULL;
UPDATE public.clients SET klarna_status = 'active' WHERE klarna_connected_at IS NOT NULL AND klarna_status IS NULL;
UPDATE public.clients SET airwallex_status = 'active' WHERE airwallex_connected_at IS NOT NULL AND airwallex_status IS NULL;
UPDATE public.clients SET woopayments_status = 'active' WHERE woopayments_connected_at IS NOT NULL AND woopayments_status IS NULL;
UPDATE public.clients SET braintree_status = 'active' WHERE braintree_connected_at IS NOT NULL AND braintree_status IS NULL;
UPDATE public.clients SET adyen_status = 'active' WHERE adyen_connected_at IS NOT NULL AND adyen_status IS NULL;
UPDATE public.clients SET wix_status = 'active' WHERE wix_connected_at IS NOT NULL AND wix_status IS NULL;
UPDATE public.clients SET magento_status = 'active' WHERE magento_connected_at IS NOT NULL AND magento_status IS NULL;
```

### Option 2: Verify Migration Was Applied

To verify the migration was successfully applied, run this query in SQL Editor:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'clients' 
AND column_name LIKE '%_status';
```

You should see 11 rows returned (one for each integration status field).

## After Applying the Migration

1. Refresh your application in the browser
2. Open the browser console (F12)
3. Try to activate/pause an integration
4. Check the console logs for any errors
5. The integration should now properly switch between Active and Paused states

## Troubleshooting

### Issue: Still showing "Paused" after clicking
**Solution:** Check browser console for errors. The most common issue is that the migration wasn't applied.

### Issue: Database error in console
**Solution:** Verify the migration was applied correctly using the verification query above.

### Issue: No changes happening at all
**Solution:** Clear browser cache and hard reload (Ctrl+Shift+R or Cmd+Shift+R)
