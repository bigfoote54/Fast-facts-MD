import { test, expect } from '@playwright/test';

test.describe('Fast Facts MD - Mobile Safari Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page
    await page.goto('/');
  });

  test('should display the app header and chat interface on iPhone 14', async ({ page }) => {
    // Check that the main header is visible
    await expect(page.getByText('Fast Facts MD')).toBeVisible();
    await expect(page.getByText('Medical Study Assistant')).toBeVisible();

    // Verify the chat interface elements are present
    const chatInput = page.getByTestId('chat-input');
    await expect(chatInput).toBeVisible();
    
    const sendButton = page.getByTestId('send-button');
    await expect(sendButton).toBeVisible();

    // Check that the initial AI greeting message is displayed
    await expect(page.getByText(/Hello.*AI study assistant/)).toBeVisible();
  });

  test('should allow typing and sending a message', async ({ page }) => {
    const chatInput = page.getByTestId('chat-input');
    const sendButton = page.getByTestId('send-button');

    // Initially, send button should be disabled
    await expect(sendButton).toBeDisabled();

    // Type a test message
    const testMessage = 'What is the difference between arteries and veins?';
    await chatInput.fill(testMessage);

    // Send button should now be enabled
    await expect(sendButton).toBeEnabled();

    // Send the message
    await sendButton.click();

    // Check that the message appears in the chat
    await expect(page.getByText(testMessage)).toBeVisible();

    // Input should be cleared after sending
    await expect(chatInput).toHaveValue('');

    // Wait for AI response and verify it appears
    await expect(page.getByText(/Thanks for your question/)).toBeVisible({ timeout: 5000 });
  });

  test('should handle long messages properly on mobile', async ({ page }) => {
    const chatInput = page.getByTestId('chat-input');
    const sendButton = page.getByTestId('send-button');

    // Test with a longer message to ensure mobile wrapping works
    const longMessage = 'Can you explain the pathophysiology of myocardial infarction including the cellular mechanisms involved, risk factors, diagnostic criteria, and treatment protocols used in emergency medicine?';
    
    await chatInput.fill(longMessage);
    await sendButton.click();

    // Verify the long message is displayed and wrapped properly
    await expect(page.getByText(longMessage)).toBeVisible();
    
    // Check that the message container doesn't overflow horizontally
    const userMessage = page.locator('[style*="alignSelf: flex-end"]').last();
    const boundingBox = await userMessage.boundingBox();
    const viewportSize = page.viewportSize();
    
    if (boundingBox && viewportSize) {
      // Message should not extend beyond viewport width
      expect(boundingBox.x + boundingBox.width).toBeLessThanOrEqual(viewportSize.width);
    }
  });

  test('should be responsive and maintain usability on mobile viewport', async ({ page }) => {
    // Check that the input area is accessible and properly positioned
    const inputContainer = page.locator('div').filter({ has: page.getByTestId('chat-input') });
    await expect(inputContainer).toBeVisible();

    // Ensure the input is in the viewport and clickable
    const chatInput = page.getByTestId('chat-input');
    await chatInput.click();
    await expect(chatInput).toBeFocused();

    // Test that keyboard doesn't obscure input on mobile
    await chatInput.fill('Test message');
    
    // Verify input remains visible after typing
    await expect(chatInput).toBeVisible();
    
    // Check that send button is properly positioned next to input
    const sendButton = page.getByTestId('send-button');
    const inputBox = await chatInput.boundingBox();
    const buttonBox = await sendButton.boundingBox();
    
    if (inputBox && buttonBox) {
      // Send button should be to the right of input and roughly aligned
      expect(buttonBox.x).toBeGreaterThan(inputBox.x + inputBox.width - 50);
      expect(Math.abs(buttonBox.y - inputBox.y)).toBeLessThan(20);
    }
  });

  test('should display timestamps correctly', async ({ page }) => {
    const chatInput = page.getByTestId('chat-input');
    const sendButton = page.getByTestId('send-button');

    // Send a message
    await chatInput.fill('Test timestamp message');
    await sendButton.click();

    // Check that timestamp is displayed
    const timestampRegex = /^\d{1,2}:\d{2}$/; // HH:MM format
    await expect(page.locator('text=/^\\d{1,2}:\\d{2}$/')).toBeVisible();
  });

  test('should handle empty input gracefully', async ({ page }) => {
    const chatInput = page.getByTestId('chat-input');
    const sendButton = page.getByTestId('send-button');

    // Try to send empty message
    await chatInput.fill('');
    await expect(sendButton).toBeDisabled();

    // Try with just whitespace
    await chatInput.fill('   ');
    await expect(sendButton).toBeDisabled();

    // Clear and try again
    await chatInput.fill('');
    await chatInput.fill('Valid message');
    await expect(sendButton).toBeEnabled();
  });
});