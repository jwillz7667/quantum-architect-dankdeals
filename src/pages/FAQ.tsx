import { MobileHeader } from "@/components/MobileHeader";
import { BottomNav } from "@/components/BottomNav";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    question: "What are your delivery hours?",
    answer: "We deliver Monday through Sunday from 9 AM to 9 PM. Holiday hours may vary."
  },
  {
    question: "What is the minimum order amount?",
    answer: "The minimum order amount is $25 before taxes and delivery fees."
  },
  {
    question: "Do you accept cash payments?",
    answer: "Yes, we accept cash on delivery as well as credit/debit cards and digital payments."
  },
  {
    question: "How long does delivery take?",
    answer: "Most deliveries are completed within 30-60 minutes depending on your location and current demand."
  },
  {
    question: "Do I need a medical card?",
    answer: "No, we serve both medical and recreational customers. You just need to be 21+ with valid ID."
  },
  {
    question: "What if I'm not satisfied with my order?",
    answer: "We offer a satisfaction guarantee. Contact us within 24 hours if you have any issues with your order."
  }
];

export default function FAQ() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <MobileHeader title="FAQ" />
      
      <div className="max-w-md mx-auto px-4 py-6">
        <h2 className="text-xl font-bold text-foreground mb-6">
          Frequently Asked Questions
        </h2>
        
        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
      
      <BottomNav />
    </div>
  );
}