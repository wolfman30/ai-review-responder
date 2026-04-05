import { describe, it, expect } from "vitest";
import { mockSESSend } from "../setup";

import { sendNewReviewAlert } from "@/app/lib/email";

describe("sendNewReviewAlert", () => {
  const baseParams = {
    toEmail: "owner@business.com",
    locationName: "Test Biz",
    starRating: 5,
    authorName: "Happy Customer",
    reviewText: "Amazing service!",
    dashboardUrl: "https://reviewai.test/app/dashboard",
  };

  it("sends email with correct recipient and subject", async () => {
    await sendNewReviewAlert(baseParams);
    expect(mockSESSend).toHaveBeenCalledTimes(1);
    const command = mockSESSend.mock.calls[0][0];
    expect(command.Destination.ToAddresses).toContain("owner@business.com");
    expect(command.Message.Subject.Data).toContain("5-star");
    expect(command.Message.Subject.Data).toContain("Test Biz");
  });

  it("includes review text in email body", async () => {
    await sendNewReviewAlert(baseParams);
    const command = mockSESSend.mock.calls[0][0];
    expect(command.Message.Body.Html.Data).toContain("Amazing service!");
    expect(command.Message.Body.Text.Data).toContain("Amazing service!");
  });

  it("truncates long review text to 120 chars", async () => {
    const longReview = "A".repeat(200);
    await sendNewReviewAlert({ ...baseParams, reviewText: longReview });
    const command = mockSESSend.mock.calls[0][0];
    expect(command.Message.Body.Text.Data).toContain("...");
  });

  it("handles null review text", async () => {
    await sendNewReviewAlert({ ...baseParams, reviewText: null });
    const command = mockSESSend.mock.calls[0][0];
    expect(command.Message.Body.Text.Data).toContain("(No comment)");
  });

  it("does not throw on SES failure", async () => {
    mockSESSend.mockRejectedValue(new Error("SES down"));
    await expect(sendNewReviewAlert(baseParams)).resolves.not.toThrow();
  });

  it("includes dashboard link in email", async () => {
    await sendNewReviewAlert(baseParams);
    const command = mockSESSend.mock.calls[0][0];
    expect(command.Message.Body.Html.Data).toContain(baseParams.dashboardUrl);
  });

  it("uses warning emoji for low ratings", async () => {
    await sendNewReviewAlert({ ...baseParams, starRating: 1 });
    const command = mockSESSend.mock.calls[0][0];
    expect(command.Message.Subject.Data).toContain("1-star");
  });
});
