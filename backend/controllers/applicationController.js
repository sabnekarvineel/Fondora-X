import Application from '../models/Application.js';
import Job from '../models/Job.js';
import { createNotification } from './notificationController.js';
import { getIO } from '../socket/socketHandler.js';

export const applyForJob = async (req, res) => {
  try {
    const { jobId, coverLetter, resume, portfolio, proposedRate } = req.body;

    // Guard: Validate required fields
    if (!jobId) {
      return res.status(400).json({ message: 'Job ID is required' });
    }

    if (!coverLetter || !coverLetter.trim()) {
      return res.status(400).json({ message: 'Cover letter is required' });
    }

    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Guard: Validate job has required fields
    if (!job.postedBy) {
      return res.status(400).json({ message: 'Job data is incomplete' });
    }

    if (job.status !== 'open') {
      return res.status(400).json({ message: 'This job is no longer accepting applications' });
    }

    const existingApplication = await Application.findOne({
      job: jobId,
      applicant: req.user._id,
    });

    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied for this job' });
    }

    const application = await Application.create({
      job: jobId,
      applicant: req.user._id,
      coverLetter: coverLetter.trim(),
      resume: resume || undefined,
      portfolio: portfolio || undefined,
      proposedRate: proposedRate || undefined,
    });

    // Guard: Check if application was created successfully
    if (!application || !application._id) {
      return res.status(500).json({ message: 'Failed to create application' });
    }

    job.applications.push(application._id);
    await job.save();

    const populatedApplication = await Application.findById(application._id)
      .populate('applicant', 'name profilePhoto role email')
      .populate('job', 'title type');

    // Guard: Ensure notification data is valid before creating notification
    if (job.postedBy && req.user.name) {
      const notification = await createNotification({
        recipient: job.postedBy,
        sender: req.user._id,
        type: 'investor_interest',
        message: `${req.user.name} applied for your ${job.type}: ${job.title}`,
        link: `/jobs/${jobId}`,
      });

      if (notification) {
        const io = getIO();
        io.to(job.postedBy.toString()).emit('newNotification', notification);
      }
    }

    res.status(201).json(populatedApplication);
  } catch (error) {
    console.error('Apply for job error:', error);
    res.status(500).json({ message: error.message || 'Failed to submit application' });
  }
};

export const getMyApplications = async (req, res) => {
  try {
    // Guard: Validate user exists
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const applications = await Application.find({ applicant: req.user._id })
      .populate('job')
      .populate({
        path: 'job',
        populate: {
          path: 'postedBy',
          select: 'name profilePhoto role startupProfile.startupName',
        },
      })
      .sort({ createdAt: -1 });

    // Guard: Filter out applications with incomplete job data
    const validApplications = applications.filter(app => 
      app && app.job && app.job._id
    );

    res.json(validApplications);
  } catch (error) {
    console.error('Get my applications error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getJobApplications = async (req, res) => {
  try {
    // Guard: Validate user and params
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!req.params.jobId) {
      return res.status(400).json({ message: 'Job ID is required' });
    }

    const job = await Job.findById(req.params.jobId);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Guard: Validate job has postedBy before accessing
    if (!job.postedBy) {
      return res.status(400).json({ message: 'Job data is incomplete' });
    }

    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view these applications' });
    }

    const applications = await Application.find({ job: req.params.jobId })
      .populate('applicant', 'name profilePhoto role email skills bio')
      .sort({ createdAt: -1 });

    // Guard: Filter out invalid applications
    const validApplications = applications.filter(app => 
      app && app._id && app.applicant
    );

    res.json(validApplications);
  } catch (error) {
    console.error('Get job applications error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const updateApplicationStatus = async (req, res) => {
  try {
    // Guard: Validate inputs
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!req.params.id) {
      return res.status(400).json({ message: 'Application ID is required' });
    }

    if (!req.body.status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const { status, notes } = req.body;
    const application = await Application.findById(req.params.id).populate('job');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Guard: Validate application has job and required fields
    if (!application.job || !application.job.postedBy) {
      return res.status(400).json({ message: 'Application data is incomplete' });
    }

    if (!application.applicant) {
      return res.status(400).json({ message: 'Application applicant data is missing' });
    }

    if (application.job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this application' });
    }

    application.status = status;
    if (notes) {
      application.notes = notes;
    }

    await application.save();

    // Guard: Only create notification if applicant exists
    if (application.applicant && application.applicant._id) {
      const notification = await createNotification({
        recipient: application.applicant,
        sender: req.user._id,
        type: 'investor_interest',
        message: `Your application status has been updated to: ${status}`,
        link: `/applications`,
      });

      if (notification) {
        const io = getIO();
        io.to(application.applicant.toString()).emit('newNotification', notification);
      }
    }

    res.json(application);
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteApplication = async (req, res) => {
  try {
    // Guard: Validate user
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!req.params.id) {
      return res.status(400).json({ message: 'Application ID is required' });
    }

    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Guard: Validate application has applicant before accessing
    if (!application.applicant) {
      return res.status(400).json({ message: 'Application data is incomplete' });
    }

    if (application.applicant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this application' });
    }

    // Guard: Ensure job exists before updating
    if (application.job) {
      await Job.findByIdAndUpdate(application.job, {
        $pull: { applications: application._id },
      });
    }

    await application.deleteOne();

    res.json({ message: 'Application withdrawn successfully' });
  } catch (error) {
    console.error('Delete application error:', error);
    res.status(500).json({ message: error.message });
  }
};
