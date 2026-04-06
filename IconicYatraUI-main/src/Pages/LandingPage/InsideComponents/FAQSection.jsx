import React, { useState } from "react";
import {
  Box,
  Container,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const FAQSection = ({ landingData }) => {
  const [expanded, setExpanded] = useState(false);

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const faqs = landingData?.faqQuestions || [];

  return (
    <Box sx={{ background: "#f5f5f5", py: 6 }}>
      <Container maxWidth="lg">
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
          {landingData?.faqTitle}
        </Typography>

        {faqs.map((faq, index) => (
          <Accordion
            key={faq._id}
            expanded={expanded === index}
            onChange={handleChange(index)}
            sx={{
              boxShadow: "none",
              border: "1px solid #ddd",
              "&:not(:last-child)": { borderBottom: 0 },
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography fontSize={15}>
                {index + 1}. {faq.question}
              </Typography>
            </AccordionSummary>

            <AccordionDetails>
              <Typography fontSize={14} color="text.secondary">
                {faq.answer}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Container>
    </Box>
  );
};

export default FAQSection;
