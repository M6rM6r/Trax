"use client";
import { fetcherClient } from "@/lib/fetcherClient";
import { useResponseToast } from "@/lib/toastUtils";
import { Note } from "@/lib/types/responseTypes";
import { useState } from "react";

const NotesTab = ({
  notes: initialNotes,
  complaint_id,
}: {
  notes: Note[];
  complaint_id: number;
}) => {
  const [notes, setNotes] = useState<Note[]>(initialNotes || []);
  const [isOpen, setIsOpen] = useState<number>(0);
  const [addNote, setAddNote] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");
  const [replyTexts, setReplyTexts] = useState<Record<number, string>>({});
  const { showResponseToast } = useResponseToast();

  const isCurrentOpenNote = (noteId: number) => isOpen === noteId;

  // ✅ Add new note and update local state immediately
  const handleAddNote = async () => {
    if (!newNoteText.trim()) return;
    try {
      const formdata = new FormData();
      formdata.append("note", newNoteText);
      formdata.append("complaint_id", complaint_id.toString());

      const response = await fetcherClient<{ data: { note: Note } }>("/notes", {
        method: "POST",
        body: formdata,
      });

      // ✅ Insert new note at the top of the list instantly
      if (response?.data) {
        const responseObj = {
          success: true,
          message: "تم إرسال الملاحظة",
          data: response?.data.note,
        };

        showResponseToast(responseObj);

        setNotes((prev) => [response.data.note, ...prev]);
      }
    } catch (err: any) {
      showResponseToast(err.info);
    } finally {
      setNewNoteText("");
      setAddNote(false);
    }
  };

  // ✅ Add new reply and update nested state instantly
  const handleAddReply = async (noteId: number) => {
    const replyText = replyTexts[noteId];
    if (!replyText?.trim()) return;

    try {
      const formdata = new FormData();
      formdata.append("note", replyText);
      formdata.append("complaint_id", complaint_id.toString());
      formdata.append("parent_id", noteId.toString());

      const response = await fetcherClient<{ data: { note: Note } }>("/notes", {
        method: "POST",
        body: formdata,
      });

      if (response?.data) {
        const responseObj = {
          success: true,
          message: "تم إرسال الرد",
          data: response?.data.note,
        };
        showResponseToast(responseObj);
      }

      if (response?.data) {
        setNotes((prevNotes) =>
          prevNotes.map((note) =>
            note.id === noteId
              ? {
                  ...note,
                  replies: [...(note.replies || []), response.data.note],
                }
              : note
          )
        );
      }
    } catch (err: any) {
      showResponseToast(err.info);
    } finally {
      setReplyTexts((prev) => ({ ...prev, [noteId]: "" }));
    }
  };

  const handleReplyTextChange = (noteId: number, text: string) => {
    setReplyTexts((prev) => ({ ...prev, [noteId]: text }));
  };

  const handleCancel = (noteId: number) => {
    setAddNote(false);
    setIsOpen(0);
    setNewNoteText("");
    setReplyTexts((prev) => ({ ...prev, [noteId]: "" }));
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-5">
        <p className="text-16 text-textSubText font-[600]">
          <span className="text-18 text-textMain">{notes.length}</span> ملاحظات
        </p>
        <button
          className="text-16 text-primaryColor font-[600]"
          onClick={() => setAddNote(true)}
        >
          أضف ملاحظة
        </button>
      </div>
      {addNote && (
        <div className="items-center gap-5 flex">
          <input
            type="text"
            className="grow h-[32px] py-2 px-3 outline-none bg-textBG rounded-full text-14 text-textMain placeholder:text-textSubTextDarker"
            placeholder="أضف ملاحظة جديدة"
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
          />
          <button
            className="text-14 text-primaryColor font-[600]"
            onClick={handleAddNote}
          >
            أرسل الملاحظة
          </button>
          <button
            className="text-14 text-textMain font-[600]"
            onClick={() => handleCancel(0)}
          >
            إلغاء
          </button>
        </div>
      )}

      {notes.map((note) => (
        <div
          key={note.id}
          className="flex flex-col gap-3 border border-gray200 rounded-[4px] p-3"
        >
          <p className="text-16 text-textMain ">
            {note.user?.name}{" "}
            <span className="text-12 text-textSubText">{note.created_at}</span>
          </p>
          <p className="text-16 text-textSubTextDarker">{note.note}</p>

          <div
            className={`flex items-center justify-between gap-5 cursor-pointer ${
              isCurrentOpenNote(note.id) ? "mb-3 underline" : ""
            }`}
            onClick={() => (isOpen ? setIsOpen(0) : setIsOpen(note.id))}
          >
            <p className="text-14 text-textSubText font-[600] text-nowrap">
              <span className="text-14 text-textMain font-[600]">
                {note?.replies?.length}
              </span>{" "}
              من الردود
            </p>
            <button
              className={`text-16 text-primaryColor font-[600] ${
                isCurrentOpenNote(note.id) ? "hidden" : "block"
              }`}
              onClick={() => setIsOpen(note.id)}
            >
              أضف رد
            </button>
          </div>

          {/* Replies */}
          {isCurrentOpenNote(note.id) && (
            <>
              {note.replies?.map((reply) => (
                <div key={reply.id} className="flex flex-col gap-3 mt-3 pl-3">
                  <p className="text-16 text-textMain">
                    {reply.user?.name}{" "}
                    <span className="text-12 text-textSubText">
                      {reply.created_at}
                    </span>
                  </p>
                  <p className="text-16 text-textSubTextDarker">{reply.note}</p>
                </div>
              ))}
              <div className="flex items-center gap-5 mt-2">
                <input
                  type="text"
                  className="grow h-[32px] py-2 px-3 outline-none bg-textBG rounded-full text-14 text-textMain placeholder:text-textSubTextDarker"
                  placeholder="أضف رد"
                  value={replyTexts[note.id] || ""}
                  onChange={(e) =>
                    handleReplyTextChange(note.id, e.target.value)
                  }
                />
                <button
                  className="text-14 text-primaryColor font-[600]"
                  onClick={() => handleAddReply(note.id)}
                >
                  أرسل الرد
                </button>
                <button
                  className="text-14 text-textMain font-[600]"
                  onClick={() => handleCancel(note.id)}
                >
                  إلغاء
                </button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export default NotesTab;
