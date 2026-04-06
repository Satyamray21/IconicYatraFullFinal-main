import Bank from "../../models/bankDetails.js"


export const addBankDetails = async (req, res) => {
    try {
        const { bankName, branchName, accountHolderName, accountNumber, ifscCode } = req.body;

        if (!bankName || !branchName || !accountHolderName || !accountNumber || !ifscCode) {
            return res.status(400).json({ message: "All fields are required." });
        }

        const newBank = new Bank({
            bankName, branchName, accountHolderName, accountNumber, ifscCode
        });

        await newBank.save();
        res.status(201).json({ message: "Bank details saved successfully.", data: newBank });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
}

export const getAllBankDetails = async (req, res) => {
    try {
        const allBankDetails = await Bank.find()
        res.status(200).json(allBankDetails)

        if (!allBankDetails) {
            res.status(400).json({ message: 'BankDetails not Found' })
        }
    }
    catch (error) {
        console.error(error)
        res.status(500).json({ message: error.message })
    }
}

export const getBankDetailsById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ message: "Bank ID is required." });
        }
        const viewBankDetails = await Bank.findById(id);
        res.status(200).json(viewBankDetails)

        if (!viewBankDetails) {
            return res.status(400).json({ message: 'BankDetails not find with Id' });
        }
    }
    catch (error) {
        console.error(error)
        res.status(500).json({ message: error.message })
    }
}

export const updateBankDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedBank = await Bank.findByIdAndUpdate(
            id,
            req.body,
            { new: true }
        );
        res.status(200).json(updatedBank);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteBankDetails = async (req, res) => {
    try {
        const deleteBankDetails = await Bank.findByIdAndDelete(req.params.id);

        if (!deleteBankDetails) {
            return res.status(404).json({ message: 'BankDetails not found' })
        }

        res.status(200).json({ message: 'BankDetails deleted successfully' })
    }
    catch (error) {
        console.error
        res.status(500).json({ message: error.message })
    }
};
