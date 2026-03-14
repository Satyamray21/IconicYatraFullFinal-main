import mongoose from "mongoose";

const imageSchema = new mongoose.Schema({
  public_id: String,
  url: String,
});

const overviewSchema = new mongoose.Schema({
  overviewTitle: String,
  overviewDescription: String,
  overviewImage: imageSchema,
  overviewGetFreeQuoteButton: String,
  overviewChatWithUsButton: String,
});

const solutionSchema = new mongoose.Schema({
  title: String,
  description: String,
  icon: imageSchema,
});

const featureSchema = new mongoose.Schema({
  title: String,
  description: String,
  icon: imageSchema,
});

const reasonSchema = new mongoose.Schema({
  title: String,
  description: String,
});

const workProcessSchema = new mongoose.Schema({
  step: Number,
  title: String,
  description: String,
});

const faqSchema = new mongoose.Schema({
  question: String,
  answer: String,
});

const landingPageSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
    },

    headerDescription: String,

    heroBackgroundImage: imageSchema,
    heroTitle: String,
    heroDescription: String,
    heroButtonText: String,
    heroOverlayOpacity: Number,

    overviewSections: [overviewSchema],

    ownPackageTitle: String,
    ownPackageDescription: String,
    ownPackageImage: imageSchema,
    ownPackageFeatures: [String],

    solutionTitle: String,
    solutionDescription: String,
    solutionItems: [solutionSchema],

    packageFeaturesTitle: String,
    packageFeatures: [featureSchema],

    whyChooseTitle: String,
    whyChooseBannerImage: imageSchema,
    whyChooseReasons: [reasonSchema],

    workProcessTitle: String,
    workProcessSteps: [workProcessSchema],

    faqTitle: String,
    faqQuestions: [faqSchema],

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("LandingPage", landingPageSchema);
