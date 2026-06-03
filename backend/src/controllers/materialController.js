const supabase = require('../config/supabase');
const notifyAdmins = require('../utils/notifyAdmins');

const BUCKET_NAME = 'materials';

const normalizeMaterial = (m) => {
  if (!m) return m;

  return {
    ...m,
    _id: m.id,
    courseId: m.course_id,
    uploadedBy: m.uploadedBy || m.uploader || null,
    uploaded_by: m.uploaded_by,
    fileUrl: m.file_url,
    fileName: m.file_name,
    fileType: m.file_type,
    fileSize: m.file_size,
    storagePath: m.storage_path,
    uploadedAt: m.uploaded_at,
  };
};

exports.uploadMaterial = async (req, res) => {
  try {
    const { title, description, courseId, type, link, week } = req.body;

    if (!title || !courseId || !type) {
      return res.status(400).json({
        success: false,
        message: 'Title, course and type are required',
      });
    }

    const hasFile = !!req.file;
    const hasLink = !!(link && link.trim());

    if (!hasFile && !hasLink) {
      return res.status(400).json({
        success: false,
        message: 'Please provide either a file or an external link',
      });
    }

    let fileUrl = null;
    let fileName = null;
    let fileType = null;
    let fileSize = null;
    let storagePath = null;

    if (req.file) {
      const safeOriginalName = req.file.originalname.replace(/\s/g, '_');
      const uniqueFileName = `${Date.now()}-${safeOriginalName}`;
      const filePath = `${courseId}/${uniqueFileName}`;

      const { data: upload, error: uploadErr } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false,
        });

      if (uploadErr) {
        return res.status(500).json({
          success: false,
          message: uploadErr.message,
        });
      }

      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(upload.path);

      fileUrl = urlData.publicUrl;
      fileName = req.file.originalname;
      fileType = req.file.mimetype;
      fileSize = req.file.size;
      storagePath = upload.path;
    }

    const { data: material, error } = await supabase
      .from('learning_materials')
      .insert({
        title,
        description: description || null,
        course_id: courseId,
        uploaded_by: req.user.id,
        type,
        link: hasLink ? link.trim() : null,
        week: week ? parseInt(week, 10) : null,
        file_url: fileUrl,
        file_name: fileName,
        file_type: fileType,
        file_size: fileSize,
        storage_path: storagePath,
      })
      .select('*, uploadedBy:users!uploaded_by(id, name), course:courses(id, name, code)')
      .single();

    if (error) throw error;

    await notifyAdmins({
      senderId: req.user.id,
      type: 'material',
      title: 'New Learning Material Uploaded',
      message: `${req.user.name || 'A teacher'} uploaded "${material.title}" for ${material.course?.name || 'a course'}.`,
      io: req.io,
    });

    res.status(201).json({
      success: true,
      material: normalizeMaterial(material),
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getCourseMaterials = async (req, res) => {
  try {
    const { data: materials, error } = await supabase
      .from('learning_materials')
      .select('*, uploadedBy:users!uploaded_by(id, name)')
      .eq('course_id', req.params.courseId)
      .order('uploaded_at', {
        ascending: false,
      });

    if (error) throw error;

    res.json({
      success: true,
      materials: (materials || []).map(normalizeMaterial),
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.deleteMaterial = async (req, res) => {
  try {
    const { data: material, error: fetchErr } = await supabase
      .from('learning_materials')
      .select('id, storage_path, file_url')
      .eq('id', req.params.id)
      .single();

    if (fetchErr) {
      return res.status(404).json({
        success: false,
        message: 'Material not found',
      });
    }

    if (material?.storage_path) {
      await supabase.storage.from(BUCKET_NAME).remove([material.storage_path]);
    } else if (material?.file_url) {
      const path = material.file_url.split(`/${BUCKET_NAME}/`)[1];

      if (path) {
        await supabase.storage.from(BUCKET_NAME).remove([path]);
      }
    }

    const { error: deleteErr } = await supabase
      .from('learning_materials')
      .delete()
      .eq('id', req.params.id);

    if (deleteErr) throw deleteErr;

    res.json({
      success: true,
      message: 'Material deleted',
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};