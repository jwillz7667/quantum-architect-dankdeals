import { MobileHeader } from '@/components/MobileHeader';
import { DesktopHeader } from '@/components/DesktopHeader';
import { BottomNav } from '@/components/BottomNav';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { SEOHead } from '@/components/SEOHead';

const faqs = [
  {
    question: 'What are your delivery hours?',
    answer:
      'We deliver Monday through Sunday from 10 AM to 10 PM. Holiday hours may vary. Same-day delivery is available throughout Minneapolis, St. Paul, and surrounding areas.',
  },
  {
    question: 'What is the minimum order amount?',
    answer:
      'The minimum order amount is $50 before taxes and delivery fees. This helps us maintain efficient delivery routes and provide the best service.',
  },
  {
    question: 'Do you accept cash payments?',
    answer:
      'Yes, we accept cash on delivery. Payment is due upon delivery. We also accept credit/debit cards and digital payments for your convenience.',
  },
  {
    question: 'How long does delivery take?',
    answer:
      'Most deliveries are completed within 30-60 minutes depending on your location and current demand. During peak hours, delivery may take up to 90 minutes.',
  },
  {
    question: 'Do I need a medical card?',
    answer:
      'Minnesota law requires all customers to be 21+ with valid ID. We serve both medical and recreational customers in compliance with state regulations.',
  },
  {
    question: 'What areas do you deliver to?',
    answer:
      'We deliver to Minneapolis, St. Paul, Bloomington, Edina, Minnetonka, and over 40 other cities in the Twin Cities metro area. Check our delivery area page for full coverage.',
  },
  {
    question: 'Is there a delivery fee?',
    answer:
      'Delivery fees vary by location, typically ranging from $5-15. Free delivery is available on orders over $150 to most areas.',
  },
  {
    question: "What if I'm not satisfied with my order?",
    answer:
      "We offer a 100% satisfaction guarantee. Contact us within 24 hours if you have any issues with your order and we'll make it right.",
  },
  {
    question: 'Are your products lab tested?',
    answer:
      'Yes, all products are third-party lab tested for potency, pesticides, and contaminants. Lab results are available upon request.',
  },
  {
    question: 'Can I track my delivery?',
    answer:
      "Yes, you'll receive text updates about your order status and estimated delivery time. Our drivers will contact you when they're nearby.",
  },
];

export default function FAQ() {
  const breadcrumbs = [
    { name: 'Home', url: 'https://dankdealsmn.com' },
    { name: 'FAQ', url: 'https://dankdealsmn.com/faq' },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <SEOHead
        title="Frequently Asked Questions"
        description="Find answers to common questions about DankDeals cannabis delivery service in Minneapolis. Learn about ordering, delivery, payment, and more."
        breadcrumbs={breadcrumbs}
      />
      <DesktopHeader />
      <MobileHeader title="FAQ" />

      <div className="max-w-md mx-auto px-4 py-6">
        <h2 className="text-xl font-bold text-foreground mb-6">Frequently Asked Questions</h2>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <BottomNav />
    </div>
  );
}
